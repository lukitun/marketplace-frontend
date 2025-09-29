# Marketplace Application

A full-stack marketplace application with subscription management, user authentication, and admin panel.

## Features

- **User Registration & Authentication**: Secure JWT-based authentication
- **Post Management**: Users can create, view, and manage posts with images
- **Subscription System**: Manual subscription management via admin panel
- **Contact Information Protection**: Contact details only visible to subscribed members
- **Admin Panel**: Complete user and post management interface
- **Email Invoices**: Automatic invoice generation and email delivery
- **Responsive Design**: Mobile-friendly React frontend

## Tech Stack

- **Backend**: Node.js, Express.js, MySQL
- **Frontend**: React, React Router, Axios
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer
- **Deployment**: VPS (Backend) + Netlify (Frontend)

## Project Structure

```
marketplace-app/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth & validation middleware
│   ├── routes/          # API routes
│   ├── utils/           # Email service utilities
│   ├── database/        # SQL schema
│   ├── public/uploads/  # Image uploads directory
│   └── server.js        # Main server file
└── frontend/
    ├── public/          # Static files
    └── src/
        ├── components/  # Reusable components
        ├── context/     # Auth context
        ├── pages/       # Page components
        ├── services/    # API services
        └── styles/      # CSS files
```

## Installation & Setup

### VPS Setup (Backend on 207.180.241.64)

1. **Install MySQL and create database:**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install mysql-server -y

# Access MySQL
sudo mysql

# Create database and user
CREATE DATABASE marketplace_db;
CREATE USER 'marketplace_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON marketplace_db.* TO 'marketplace_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

2. **Import database schema:**
```bash
cd /root/marketplace/marketplace-app/backend
mysql -u marketplace_user -p marketplace_db < database/schema.sql
```

3. **Configure environment variables:**
```bash
cd /root/marketplace/marketplace-app/backend
cp .env.example .env
nano .env  # Edit with your configuration
```

Required `.env` settings:
```
DB_HOST=localhost
DB_USER=marketplace_user
DB_PASSWORD=your_secure_password
DB_NAME=marketplace_db
PORT=5000
JWT_SECRET=your_super_secret_key
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=https://your-site.netlify.app
```

4. **Install dependencies and start backend:**
```bash
cd /root/marketplace/marketplace-app/backend
npm install
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

5. **Configure firewall:**
```bash
sudo ufw allow 5000
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Frontend Deployment (Netlify)

1. **Prepare frontend for deployment:**
```bash
cd /root/marketplace/marketplace-app/frontend

# Install dependencies
npm install

# Update API URL in .env.production
echo "REACT_APP_API_URL=http://207.180.241.64:5000/api" > .env.production

# Build the project
npm run build
```

2. **Deploy to Netlify:**

Option A - Using Netlify CLI:
```bash
npm install -g netlify-cli
netlify login
netlify deploy --dir=build --prod
```

Option B - Using GitHub:
- Push frontend folder to GitHub repository
- Connect GitHub repo to Netlify
- Netlify will auto-deploy on push

Option C - Manual drag & drop:
- Build locally: `npm run build`
- Drag the `build` folder to Netlify dashboard

## Usage

### Default Admin Account
```
Email: admin@marketplace.com
Password: admin123
```
**Important**: Change this password immediately after first login!

### User Features
1. **Registration**: Create account at `/register`
2. **Create Posts**: Add posts with images and contact information
3. **View Posts**: Browse all published posts
4. **Subscription**: Contact info visible only to subscribed members

### Admin Features
1. **User Management**: View all users, activate/deactivate subscriptions
2. **Post Management**: View, publish/unpublish, delete posts
3. **Send Invoices**: Email invoices when activating subscriptions
4. **Dashboard**: View statistics and recent activities

### Subscription Management
1. Admin manually activates subscriptions via admin panel
2. Set duration (months) and amount
3. Optional: Send invoice email to user
4. Users receive email with payment details

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post (auth required)
- `PUT /api/posts/:id` - Update post (auth required)
- `DELETE /api/posts/:id` - Delete post (auth required)

### Admin
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:userId/subscription` - Update subscription
- `GET /api/admin/posts` - Get all posts (admin view)
- `PUT /api/admin/posts/:postId/visibility` - Toggle post visibility
- `GET /api/admin/dashboard/stats` - Get dashboard statistics

## Environment Variables

### Backend (.env)
```
# Database
DB_HOST=localhost
DB_USER=marketplace_user
DB_PASSWORD=your_password
DB_NAME=marketplace_db

# Server
PORT=5000
NODE_ENV=production

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=30d

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend
FRONTEND_URL=https://your-site.netlify.app
```

### Frontend (.env.production)
```
REACT_APP_API_URL=http://207.180.241.64:5000/api
```

## Security Considerations

1. **Change default admin password immediately**
2. **Use strong JWT secret key**
3. **Configure HTTPS for production**
4. **Set up proper CORS origins**
5. **Use environment variables for sensitive data**
6. **Regular database backups**
7. **Configure rate limiting**

## Maintenance

### Backend Monitoring
```bash
# View logs
pm2 logs marketplace-backend

# Monitor status
pm2 status

# Restart backend
pm2 restart marketplace-backend
```

### Database Backup
```bash
# Backup database
mysqldump -u marketplace_user -p marketplace_db > backup_$(date +%Y%m%d).sql

# Restore database
mysql -u marketplace_user -p marketplace_db < backup_20240101.sql
```

## Troubleshooting

### Backend not accessible
1. Check if backend is running: `pm2 status`
2. Check firewall: `sudo ufw status`
3. Verify port 5000 is open
4. Check logs: `pm2 logs`

### Frontend API connection issues
1. Verify REACT_APP_API_URL in .env.production
2. Check CORS settings in backend
3. Ensure backend is running on specified port

### Email not sending
1. Verify EMAIL credentials in .env
2. For Gmail: Enable "App Passwords"
3. Check email service logs in backend

## Support

For issues or questions, please check:
1. Backend logs: `pm2 logs marketplace-backend`
2. MySQL status: `sudo systemctl status mysql`
3. Network connectivity: `curl http://207.180.241.64:5000/health`

## License

MIT License - Free to use and modify