const express = require('express');
const router = express.Router();
const { sendInvoiceEmail } = require('../utils/emailService');
const { protect, authorize } = require('../middleware/auth');

// Test email sending (admin only)
router.post('/send-test-email', protect, authorize('admin'), async (req, res) => {
    try {
        const testInvoiceData = {
            invoiceNumber: `TEST-INV-${Date.now()}`,
            userName: 'Test User',
            amount: 29.99,
            duration: 1,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        };

        const result = await sendInvoiceEmail('test@example.com', testInvoiceData);

        res.json({
            success: result.success,
            message: result.success ? 'Test email sent successfully' : 'Failed to send test email',
            previewUrl: result.previewUrl,
            error: result.error
        });
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;