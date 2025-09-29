const express = require('express');
const router = express.Router();
const {
    requestSubscription,
    getUserRequests,
    getAllRequests,
    updateRequestStatus
} = require('../controllers/subscriptionController');
const { protect, authorize } = require('../middleware/auth');

// User routes (protected)
router.post('/request', protect, requestSubscription);
router.get('/requests', protect, getUserRequests);

// Admin routes
router.get('/admin/requests', protect, authorize('admin'), getAllRequests);
router.put('/admin/requests/:requestId', protect, authorize('admin'), updateRequestStatus);

module.exports = router;