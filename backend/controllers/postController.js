const { pool } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

// Get all posts (public view - no contact info for non-subscribers)
exports.getAllPosts = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;
        const isSubscribed = req.user?.is_subscribed || false;

        // Build query based on subscription status
        const contactInfoField = isSubscribed ? 'p.contact_info' : 'NULL as contact_info';

        let query = `
            SELECT
                p.id,
                p.title,
                p.content,
                p.image_url,
                ${contactInfoField},
                p.views,
                p.created_at,
                u.username,
                u.full_name
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.is_published = TRUE
        `;

        const queryParams = [];

        if (search) {
            query += ' AND (p.title LIKE ? OR p.content LIKE ?)';
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY p.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
        // queryParams.push(Number(limit), Number(offset));

        const [posts] = await pool.execute(query, queryParams);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM posts WHERE is_published = TRUE';
        const countParams = [];

        if (search) {
            countQuery += ' AND (title LIKE ? OR content LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`);
        }

        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            success: true,
            posts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get single post
exports.getPost = async (req, res) => {
    try {
        const { id } = req.params;
        const isSubscribed = req.user?.is_subscribed || false;

        // Increment view count
        await pool.execute(
            'UPDATE posts SET views = views + 1 WHERE id = ?',
            [id]
        );

        const query = `
            SELECT
                p.id,
                p.title,
                p.content,
                p.image_url,
                ${isSubscribed ? 'p.contact_info,' : 'NULL as contact_info,'}
                p.views,
                p.created_at,
                p.updated_at,
                u.username,
                u.full_name,
                u.email
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ? AND p.is_published = TRUE
        `;

        const [posts] = await pool.execute(query, [id]);

        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        res.json({
            success: true,
            post: posts[0]
        });
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Create post
exports.createPost = async (req, res) => {
    try {
        const { title, content, contact_info } = req.body;
        const user_id = req.user.id;
        let image_url = null;

        // Handle image upload if present
        if (req.file) {
            image_url = `/uploads/${req.file.filename}`;
        }

        const [result] = await pool.execute(
            'INSERT INTO posts (user_id, title, content, image_url, contact_info) VALUES (?, ?, ?, ?, ?)',
            [user_id, title, content, image_url, contact_info]
        );

        // Log activity
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
            [user_id, 'create_post', `Created post: ${title}`]
        );

        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            postId: result.insertId
        });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update post
exports.updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, contact_info } = req.body;
        const user_id = req.user.id;

        // Check if user owns the post or is admin
        const [posts] = await pool.execute(
            'SELECT user_id, image_url FROM posts WHERE id = ?',
            [id]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        if (posts[0].user_id !== user_id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this post'
            });
        }

        let image_url = posts[0].image_url;

        // Handle new image upload
        if (req.file) {
            // Delete old image if exists
            if (image_url) {
                const oldImagePath = path.join(__dirname, '..', 'public', image_url);
                try {
                    await fs.unlink(oldImagePath);
                } catch (err) {
                    console.log('Old image not found');
                }
            }
            image_url = `/uploads/${req.file.filename}`;
        }

        await pool.execute(
            'UPDATE posts SET title = ?, content = ?, contact_info = ?, image_url = ? WHERE id = ?',
            [title, content, contact_info, image_url, id]
        );

        res.json({
            success: true,
            message: 'Post updated successfully'
        });
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Delete post
exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        // Check if user owns the post or is admin
        const [posts] = await pool.execute(
            'SELECT user_id, image_url FROM posts WHERE id = ?',
            [id]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        if (posts[0].user_id !== user_id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this post'
            });
        }

        // Delete associated image if exists
        if (posts[0].image_url) {
            const imagePath = path.join(__dirname, '..', 'public', posts[0].image_url);
            try {
                await fs.unlink(imagePath);
            } catch (err) {
                console.log('Image not found');
            }
        }

        await pool.execute('DELETE FROM posts WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Post deleted successfully'
        });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get user's posts
exports.getUserPosts = async (req, res) => {
    try {
        const user_id = req.user.id;

        const [posts] = await pool.execute(
            `SELECT
                id,
                title,
                content,
                image_url,
                contact_info,
                views,
                is_published,
                created_at,
                updated_at
            FROM posts
            WHERE user_id = ?
            ORDER BY created_at DESC`,
            [user_id]
        );

        res.json({
            success: true,
            posts
        });
    } catch (error) {
        console.error('Get user posts error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};