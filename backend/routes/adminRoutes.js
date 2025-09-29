const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    updateUserSubscription,
    getDashboardStats,
    getAllPostsAdmin,
    togglePostVisibility,
    getSubscriptionHistory
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// User management
router.get('/users', getAllUsers);
router.put('/users/:userId/subscription', updateUserSubscription);
router.get('/users/:userId/subscriptions', getSubscriptionHistory);

// Post management
router.get('/posts', getAllPostsAdmin);
router.put('/posts/:postId/visibility', togglePostVisibility);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

module.exports = router;