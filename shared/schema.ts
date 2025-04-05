import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users for the admin panel
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false)
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true
});

// Telegram users
export const telegramUsers = pgTable("telegram_users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  username: text("username"),
  joinedAt: timestamp("joined_at").notNull(),
  balance: integer("balance").default(0),
  referrerId: text("referrer_id"),
  referralCount: integer("referral_count").default(0),
  hasJoinedGroups: boolean("has_joined_groups").default(false),
  lastBonusClaim: timestamp("last_bonus_claim"),
  bankAccountNumber: text("bank_account_number"),
  bankName: text("bank_name"),
  bankAccountName: text("bank_account_name")
});

export const insertTelegramUserSchema = createInsertSchema(telegramUsers).omit({
  id: true
});

// Withdrawal requests
export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: serial("id").primaryKey(),
  telegramUserId: text("telegram_user_id").notNull(),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  bankAccountNumber: text("bank_account_number").notNull(),
  bankName: text("bank_name").notNull(),
  bankAccountName: text("bank_account_name").notNull()
});

export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).omit({
  id: true
});

// Session schema for authentication
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  expiresAt: timestamp("expires_at").notNull()
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true
});

// Authentication schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTelegramUser = z.infer<typeof insertTelegramUserSchema>;
export type TelegramUser = typeof telegramUsers.$inferSelect;

export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export type LoginCredentials = z.infer<typeof loginSchema>;
