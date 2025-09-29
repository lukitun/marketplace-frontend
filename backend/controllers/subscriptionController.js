const { pool } = require('../config/database');
const { sendSubscriptionRequestEmail } = require('../utils/emailService');

// Request subscription
exports.requestSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        const { message, plan = 'monthly' } = req.body;

        // Check if user already has an active subscription
        const [existingUser] = await pool.execute(
            'SELECT is_subscribed FROM users WHERE id = ?',
            [userId]
        );

        if (existingUser[0]?.is_subscribed) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active subscription'
            });
        }

        // Check if there's already a pending request
        const [existingRequest] = await pool.execute(
            'SELECT id FROM subscription_requests WHERE user_id = ? AND status = "pending"',
            [userId]
        );

        if (existingRequest.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending subscription request'
            });
        }

        // Create subscription request
        const [result] = await pool.execute(
            'INSERT INTO subscription_requests (user_id, plan, message, status) VALUES (?, ?, ?, ?)',
            [userId, plan, message, 'pending']
        );

        // Get user details for email
        const [user] = await pool.execute(
            'SELECT username, email, full_name FROM users WHERE id = ?',
            [userId]
        );

        // Send email notification to admin
        const emailResult = await sendSubscriptionRequestEmail(process.env.ADMIN_EMAIL, {
            userName: user[0].full_name || user[0].username,
            userEmail: user[0].email,
            plan,
            message,
            requestId: result.insertId
        });

        // Log activity
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
            [userId, 'subscription_request', `User requested ${plan} subscription`]
        );

        res.json({
            success: true,
            message: 'Subscription request submitted successfully. You will receive an email with payment details soon.',
            emailSent: emailResult.success,
            previewUrl: emailResult.previewUrl
        });

    } catch (error) {
        console.error('Subscription request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get user's subscription requests
exports.getUserRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        const [requests] = await pool.execute(
            'SELECT * FROM subscription_requests WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        res.json({
            success: true,
            requests
        });

    } catch (error) {
        console.error('Get user requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Admin: Get all subscription requests
exports.getAllRequests = async (req, res) => {
    try {
        const [requests] = await pool.execute(`
            SELECT
                sr.*,
                u.username,
                u.email,
                u.full_name
            FROM subscription_requests sr
            JOIN users u ON sr.user_id = u.id
            ORDER BY sr.created_at DESC
        `);

        res.json({
            success: true,
            requests
        });

    } catch (error) {
        console.error('Get all requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Admin: Update subscription request status
exports.updateRequestStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, notes } = req.body;

        await pool.execute(
            'UPDATE subscription_requests SET status = ?, admin_notes = ?, updated_at = NOW() WHERE id = ?',
            [status, notes, requestId]
        );

        res.json({
            success: true,
            message: 'Request status updated successfully'
        });

    } catch (error) {
        console.error('Update request status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};