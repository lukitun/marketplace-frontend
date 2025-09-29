const { pool } = require('../config/database');
const { sendInvoiceEmail } = require('../utils/emailService');

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', filter = 'all' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT
                id,
                username,
                email,
                full_name,
                role,
                is_subscribed,
                subscription_start,
                subscription_end,
                created_at
            FROM users
            WHERE 1=1
        `;

        const queryParams = [];

        // Add search filter
        if (search) {
            query += ' AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)';
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Add subscription filter
        if (filter === 'subscribed') {
            query += ' AND is_subscribed = TRUE';
        } else if (filter === 'unsubscribed') {
            query += ' AND is_subscribed = FALSE';
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));

        const [users] = await pool.execute(query, queryParams);

        // Get total count
        const [countResult] = await pool.execute(
            'SELECT COUNT(*) as total FROM users'
        );

        res.json({
            success: true,
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                pages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update user subscription
exports.updateUserSubscription = async (req, res) => {
    try {
        const { userId } = req.params;
        const { is_subscribed, duration_months = 1, amount = 0, send_invoice = false } = req.body;

        // Get current user data
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];
        let subscription_start = null;
        let subscription_end = null;
        let subscriptionId = null;

        if (is_subscribed) {
            subscription_start = new Date();
            subscription_end = new Date();
            subscription_end.setMonth(subscription_end.getMonth() + duration_months);

            // Create subscription record
            const [subResult] = await pool.execute(
                'INSERT INTO subscriptions (user_id, status, start_date, end_date, amount, notes) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    userId,
                    'active',
                    subscription_start,
                    subscription_end,
                    amount,
                    `Manual subscription activated by admin for ${duration_months} month(s)`
                ]
            );
            subscriptionId = subResult.insertId;

            // Update user subscription status
            await pool.execute(
                'UPDATE users SET is_subscribed = TRUE, subscription_start = ?, subscription_end = ? WHERE id = ?',
                [subscription_start, subscription_end, userId]
            );

            // Send invoice if requested
            let emailResult = null;
            if (send_invoice && subscriptionId) {
                // Generate invoice
                const invoiceNumber = `INV-${Date.now()}-${userId}`;
                const [invoiceResult] = await pool.execute(
                    'INSERT INTO invoices (user_id, subscription_id, invoice_number, amount, status) VALUES (?, ?, ?, ?, ?)',
                    [userId, subscriptionId, invoiceNumber, amount, 'paid']
                );

                // Send email
                emailResult = await sendInvoiceEmail(user.email, {
                    invoiceNumber,
                    userName: user.full_name || user.username,
                    amount,
                    duration: duration_months,
                    startDate: subscription_start,
                    endDate: subscription_end
                });

                if (emailResult.success) {
                    // Update invoice sent status
                    await pool.execute(
                        'UPDATE invoices SET sent_at = NOW() WHERE id = ?',
                        [invoiceResult.insertId]
                    );

                    await pool.execute(
                        'UPDATE subscriptions SET invoice_sent = TRUE WHERE id = ?',
                        [subscriptionId]
                    );
                } else {
                    console.error('Failed to send invoice email:', emailResult.error);
                }
            }
        } else {
            // Cancel subscription
            await pool.execute(
                'UPDATE users SET is_subscribed = FALSE WHERE id = ?',
                [userId]
            );

            // Update active subscriptions to cancelled
            await pool.execute(
                'UPDATE subscriptions SET status = ? WHERE user_id = ? AND status = ?',
                ['cancelled', userId, 'active']
            );
        }

        // Log admin action
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
            [
                req.user.id,
                'update_subscription',
                `Admin updated subscription for user ${user.email}: ${is_subscribed ? 'activated' : 'deactivated'}`
            ]
        );

        res.json({
            success: true,
            message: `Subscription ${is_subscribed ? 'activated' : 'deactivated'} successfully`,
            invoice_sent: emailResult?.success || false,
            email_preview_url: emailResult?.previewUrl || null
        });
    } catch (error) {
        console.error('Update subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        // Get user statistics
        const [userStats] = await pool.execute(`
            SELECT
                COUNT(*) as total_users,
                SUM(CASE WHEN is_subscribed = TRUE THEN 1 ELSE 0 END) as subscribed_users,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users
            FROM users
        `);

        // Get post statistics
        const [postStats] = await pool.execute(`
            SELECT
                COUNT(*) as total_posts,
                SUM(views) as total_views
            FROM posts
        `);

        // Get subscription statistics
        const [subStats] = await pool.execute(`
            SELECT
                COUNT(*) as total_subscriptions,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_subscriptions,
                SUM(amount) as total_revenue
            FROM subscriptions
        `);

        // Get recent activities
        const [recentActivities] = await pool.execute(`
            SELECT
                al.id,
                al.action,
                al.details,
                al.created_at,
                u.username
            FROM activity_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT 10
        `);

        // Get recent posts
        const [recentPosts] = await pool.execute(`
            SELECT
                p.id,
                p.title,
                p.created_at,
                u.username
            FROM posts p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            stats: {
                users: userStats[0],
                posts: postStats[0],
                subscriptions: subStats[0],
                recentActivities,
                recentPosts
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get all posts (admin view)
exports.getAllPostsAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const [posts] = await pool.execute(`
            SELECT
                p.id,
                p.title,
                p.content,
                p.image_url,
                p.contact_info,
                p.views,
                p.is_published,
                p.created_at,
                u.username,
                u.email
            FROM posts p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `, [parseInt(limit), parseInt(offset)]);

        const [countResult] = await pool.execute(
            'SELECT COUNT(*) as total FROM posts'
        );

        res.json({
            success: true,
            posts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                pages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Get posts admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Toggle post visibility
exports.togglePostVisibility = async (req, res) => {
    try {
        const { postId } = req.params;

        // Get current status
        const [posts] = await pool.execute(
            'SELECT is_published FROM posts WHERE id = ?',
            [postId]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        const newStatus = !posts[0].is_published;

        await pool.execute(
            'UPDATE posts SET is_published = ? WHERE id = ?',
            [newStatus, postId]
        );

        // Log action
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
            [
                req.user.id,
                'toggle_post_visibility',
                `Admin ${newStatus ? 'published' : 'unpublished'} post ID: ${postId}`
            ]
        );

        res.json({
            success: true,
            message: `Post ${newStatus ? 'published' : 'unpublished'} successfully`
        });
    } catch (error) {
        console.error('Toggle post visibility error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get subscription history
exports.getSubscriptionHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        const [subscriptions] = await pool.execute(`
            SELECT
                s.id,
                s.status,
                s.start_date,
                s.end_date,
                s.amount,
                s.invoice_sent,
                s.notes,
                s.created_at,
                i.invoice_number,
                i.status as invoice_status
            FROM subscriptions s
            LEFT JOIN invoices i ON s.id = i.subscription_id
            WHERE s.user_id = ?
            ORDER BY s.created_at DESC
        `, [userId]);

        res.json({
            success: true,
            subscriptions
        });
    } catch (error) {
        console.error('Get subscription history error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};