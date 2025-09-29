const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Protect routes
exports.protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const [users] = await pool.execute(
                'SELECT id, username, email, role, is_subscribed FROM users WHERE id = ?',
                [decoded.id]
            );

            if (users.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            req.user = users[0];
            next();
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

// Check if user has active subscription
exports.requireSubscription = async (req, res, next) => {
    try {
        const [users] = await pool.execute(
            'SELECT is_subscribed, subscription_end FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0 || !users[0].is_subscribed) {
            return res.status(403).json({
                success: false,
                message: 'This content requires an active subscription'
            });
        }

        // Check if subscription is expired
        if (users[0].subscription_end && new Date(users[0].subscription_end) < new Date()) {
            // Update subscription status
            await pool.execute(
                'UPDATE users SET is_subscribed = FALSE WHERE id = ?',
                [req.user.id]
            );

            return res.status(403).json({
                success: false,
                message: 'Your subscription has expired'
            });
        }

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};