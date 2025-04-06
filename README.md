# FAIR MONEY Telegram Bot
# BOT MADE BY EZIHE, EVILSPIRITE 

A Telegram bot that gamifies user referrals, enabling users to earn and withdraw money through an interactive invitation system with real-time tracking and financial rewards.

## Features

- Telegram Bot integration
- TypeScript backend
- React frontend admin dashboard
- Real-time referral tracking
- Secure withdrawal management
- Bank details validation and display

## Development

To run the project locally:

```bash
npm install
npm run dev
```

## Deployment on Render

Follow these steps to deploy the project on Render:

1. **Create a new Web Service on Render**
   - Sign up or log in to [Render](https://render.com/)
   - Click on "New" and select "Web Service"
   - Connect to your GitHub repository

2. **Configure the Web Service**
   - **Name**: `fair-money-bot` (or any name you prefer)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Choose the appropriate plan (Free tier works for testing)

3. **Set Environment Variables**
   - `NODE_ENV`: `production`
   - `TELEGRAM_BOT_TOKEN`: Your Telegram bot token

4. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy your application

## Important Notes

- Withdrawal requests can only be made on weekends
- Minimum withdrawal amount: ₦20,000
- Maximum withdrawal amount: ₦100,000
- Admin credentials: username: `admin`, password: `admin123`
