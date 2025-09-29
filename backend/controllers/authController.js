const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });
};

// Register user
exports.register = async (req, res) => {
    try {
        const { username, email, password, full_name } = req.body;

        // Check if user exists
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or username already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, full_name || null]
        );

        // Create token
        const token = generateToken(result.insertId);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: result.insertId,
                username,
                email,
                role: 'user',
                is_subscribed: false
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [email, email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Create token
        const token = generateToken(user.id);

        // Log activity
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
            [user.id, 'login', `User logged in from ${req.ip}`]
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                is_subscribed: user.is_subscribed,
                subscription_end: user.subscription_end
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get current user
exports.getMe = async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, username, email, full_name, role, is_subscribed, subscription_start, subscription_end, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: users[0]
        });
    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const { full_name, email, username } = req.body;
        const userId = req.user.id;

        // Check if email/username already exists for another user
        if (email || username) {
            const [existingUsers] = await pool.execute(
                'SELECT id FROM users WHERE (email = ? OR username = ?) AND id != ?',
                [email || '', username || '', userId]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email or username already in use'
                });
            }
        }

        // Update user
        await pool.execute(
            'UPDATE users SET full_name = COALESCE(?, full_name), email = COALESCE(?, email), username = COALESCE(?, username) WHERE id = ?',
            [full_name, email, username, userId]
        );

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};