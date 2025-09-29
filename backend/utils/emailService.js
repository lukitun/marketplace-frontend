const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_PORT == 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Generate preview URL for test emails
const getPreviewUrl = (info) => {
    if (process.env.EMAIL_HOST === 'smtp.ethereal.email') {
        return nodemailer.getTestMessageUrl(info);
    }
    return null;
};

// Send invoice email
exports.sendInvoiceEmail = async (to, invoiceData) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: to,
            subject: `Invoice ${invoiceData.invoiceNumber} - Subscription Payment`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                        .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
                        .invoice-details { background: white; padding: 20px; margin-top: 20px; border-radius: 5px; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Subscription Invoice</h1>
                        </div>

                        <div class="content">
                            <p>Dear ${invoiceData.userName},</p>
                            <p>Thank you for your subscription! Your payment has been processed successfully.</p>
                        </div>

                        <div class="invoice-details">
                            <h2>Invoice Details</h2>
                            <table>
                                <tr>
                                    <th>Invoice Number:</th>
                                    <td>${invoiceData.invoiceNumber}</td>
                                </tr>
                                <tr>
                                    <th>Amount:</th>
                                    <td>$${invoiceData.amount.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <th>Duration:</th>
                                    <td>${invoiceData.duration} month(s)</td>
                                </tr>
                                <tr>
                                    <th>Start Date:</th>
                                    <td>${new Date(invoiceData.startDate).toLocaleDateString()}</td>
                                </tr>
                                <tr>
                                    <th>End Date:</th>
                                    <td>${new Date(invoiceData.endDate).toLocaleDateString()}</td>
                                </tr>
                                <tr>
                                    <th>Status:</th>
                                    <td><strong>PAID</strong></td>
                                </tr>
                            </table>
                        </div>

                        <div class="footer">
                            <p>Thank you for your business!</p>
                            <p>If you have any questions, please contact us.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Invoice email sent to:', to);

        const previewUrl = getPreviewUrl(info);
        if (previewUrl) {
            console.log('Preview URL:', previewUrl);
        }

        return { success: true, previewUrl };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
};

// Send subscription request email to admin
exports.sendSubscriptionRequestEmail = async (to, requestData) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: to,
            subject: `New Subscription Request - ${requestData.userName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #3498db; color: white; padding: 20px; text-align: center; }
                        .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
                        .request-details { background: white; padding: 20px; margin-top: 20px; border-radius: 5px; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                        .action-button {
                            background: #27ae60;
                            color: white;
                            padding: 12px 24px;
                            text-decoration: none;
                            border-radius: 5px;
                            display: inline-block;
                            margin: 10px 5px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>New Subscription Request</h1>
                        </div>

                        <div class="content">
                            <p>A user has requested a subscription to your marketplace platform.</p>
                        </div>

                        <div class="request-details">
                            <h2>Request Details</h2>
                            <table>
                                <tr>
                                    <th>User Name:</th>
                                    <td>${requestData.userName}</td>
                                </tr>
                                <tr>
                                    <th>Email:</th>
                                    <td>${requestData.userEmail}</td>
                                </tr>
                                <tr>
                                    <th>Plan:</th>
                                    <td>${requestData.plan.charAt(0).toUpperCase() + requestData.plan.slice(1)}</td>
                                </tr>
                                <tr>
                                    <th>Request ID:</th>
                                    <td>#${requestData.requestId}</td>
                                </tr>
                                <tr>
                                    <th>Message:</th>
                                    <td>${requestData.message || 'No message provided'}</td>
                                </tr>
                            </table>

                            <div style="text-align: center; margin-top: 20px;">
                                <a href="${process.env.FRONTEND_URL}/admin/users" class="action-button">
                                    Manage Subscription
                                </a>
                            </div>
                        </div>

                        <div class="footer">
                            <p>This is an automated notification from your marketplace platform.</p>
                            <p>Please log in to your admin panel to process this request.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Subscription request email sent to:', to);

        const previewUrl = getPreviewUrl(info);
        if (previewUrl) {
            console.log('Preview URL:', previewUrl);
        }

        return { success: true, previewUrl };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
};

// Send welcome email
exports.sendWelcomeEmail = async (to, userName) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: to,
            subject: 'Welcome to Our Marketplace!',
            html: `
                <h2>Welcome ${userName}!</h2>
                <p>Thank you for registering on our marketplace platform.</p>
                <p>You can now:</p>
                <ul>
                    <li>Create and publish posts</li>
                    <li>Browse other users' posts</li>
                    <li>Subscribe to access contact information</li>
                </ul>
                <p>Best regards,<br>The Marketplace Team</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, previewUrl: getPreviewUrl(info) };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
};