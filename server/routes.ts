import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth, requireAdmin } from "./middleware/auth";
import * as authController from "./controllers/auth";
import * as adminController from "./controllers/admin";
import * as botController from "./controllers/bot";
import { initBot } from "./bot";
import session from "express-session";
import MemoryStore from "memorystore";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize bot if token is provided
  if (process.env.TELEGRAM_BOT_TOKEN) {
    const bot = initBot(process.env.TELEGRAM_BOT_TOKEN);
    
    // Setup webhook if URL is provided, otherwise use polling
    if (process.env.WEBHOOK_URL) {
      bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}/api/bot/webhook`);
    } else {
      bot.launch().then(() => {
        console.log("Bot started in polling mode");
      });
    }
  } else {
    console.warn("TELEGRAM_BOT_TOKEN not provided, bot will not start");
  }
  
  // Session middleware
  const MemorySessionStore = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fairmoney-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 86400000 }, // 24 hours
    store: new MemorySessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));
  
  // Auth routes
  app.post('/api/auth/login', authController.login);
  app.post('/api/auth/logout', requireAuth, authController.logout);
  app.get('/api/auth/me', requireAuth, authController.me);
  
  // Admin routes (protected by auth and admin middleware)
  app.get('/api/admin/dashboard', requireAuth, requireAdmin, adminController.getDashboardStats);
  app.get('/api/admin/withdrawal-requests', requireAuth, requireAdmin, adminController.getWithdrawalRequests);
  app.post('/api/admin/withdrawal-requests/update', requireAuth, requireAdmin, adminController.updateWithdrawalStatus);
  app.get('/api/admin/users', requireAuth, requireAdmin, adminController.getAllUsers);
  app.post('/api/admin/reset', requireAuth, requireAdmin, adminController.resetAllData);
  
  // Bot webhook and API routes
  app.post('/api/bot/webhook', botController.handleWebhook);
  app.get('/api/bot/stats', botController.getBotStats);
  app.post('/api/bot/withdraw', botController.submitWithdrawal);

  const httpServer = createServer(app);
  
  return httpServer;
}
