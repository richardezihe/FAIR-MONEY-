import { User, TelegramUser, WithdrawalRequest, Session, InsertUser, InsertTelegramUser, InsertWithdrawalRequest, InsertSession } from "@shared/schema";
import fs from 'fs/promises';
import path from 'path';

// Interface for storage operations
export interface IStorage {
  // Admin users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Sessions
  createSession(session: InsertSession): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;
  
  // Telegram users
  getTelegramUser(telegramId: string): Promise<TelegramUser | undefined>;
  createTelegramUser(user: InsertTelegramUser): Promise<TelegramUser>;
  updateTelegramUser(telegramId: string, updates: Partial<TelegramUser>): Promise<TelegramUser | undefined>;
  getAllTelegramUsers(): Promise<TelegramUser[]>;
  getTelegramUsersByReferrerId(referrerId: string): Promise<TelegramUser[]>;
  getTelegramUserCount(): Promise<number>;
  
  // Withdrawal requests
  createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest>;
  getWithdrawalRequestsByTelegramId(telegramId: string): Promise<WithdrawalRequest[]>;
  getAllWithdrawalRequests(): Promise<WithdrawalRequest[]>;
  updateWithdrawalRequestStatus(id: number, status: string): Promise<WithdrawalRequest | undefined>;
  getTotalWithdrawalAmount(): Promise<number>;
  
  // System operations
  resetAllData(): Promise<void>;
  resetWithdrawalRequests(): Promise<void>;
}

const DATA_PATH = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_PATH, 'users.json');
const TELEGRAM_USERS_FILE = path.join(DATA_PATH, 'telegram_users.json');
const WITHDRAWAL_REQUESTS_FILE = path.join(DATA_PATH, 'withdrawal_requests.json');
const SESSIONS_FILE = path.join(DATA_PATH, 'sessions.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_PATH, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

// Save data to JSON file
async function saveData<T>(data: T, filePath: string) {
  try {
    await ensureDataDir();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error saving data to ${filePath}:`, error);
  }
}

// Load data from JSON file
async function loadData<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    await ensureDataDir();
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (error) {
      // File doesn't exist or is invalid JSON, return default value
      await saveData(defaultValue, filePath);
      return defaultValue;
    }
  } catch (error) {
    console.error(`Error loading data from ${filePath}:`, error);
    return defaultValue;
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private telegramUsers: Map<string, TelegramUser>;
  private withdrawalRequests: Map<number, WithdrawalRequest>;
  private sessions: Map<string, Session>;
  
  private userIdCounter: number;
  private telegramUserIdCounter: number;
  private withdrawalRequestIdCounter: number;
  private sessionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.telegramUsers = new Map();
    this.withdrawalRequests = new Map();
    this.sessions = new Map();
    
    this.userIdCounter = 1;
    this.telegramUserIdCounter = 1;
    this.withdrawalRequestIdCounter = 1;
    this.sessionIdCounter = 1;
    
    // Load data from files
    this.loadData();
  }

  private async loadData() {
    // Load users
    const users = await loadData<User[]>(USERS_FILE, []);
    users.forEach(user => {
      this.users.set(user.id, user);
      this.userIdCounter = Math.max(this.userIdCounter, user.id + 1);
    });

    // Load telegram users
    const telegramUsers = await loadData<TelegramUser[]>(TELEGRAM_USERS_FILE, []);
    telegramUsers.forEach(user => {
      this.telegramUsers.set(user.telegramId, user);
      this.telegramUserIdCounter = Math.max(this.telegramUserIdCounter, user.id + 1);
    });

    // Load withdrawal requests
    const withdrawalRequests = await loadData<WithdrawalRequest[]>(WITHDRAWAL_REQUESTS_FILE, []);
    withdrawalRequests.forEach(request => {
      this.withdrawalRequests.set(request.id, request);
      this.withdrawalRequestIdCounter = Math.max(this.withdrawalRequestIdCounter, request.id + 1);
    });

    // Load sessions
    const sessions = await loadData<Session[]>(SESSIONS_FILE, []);
    sessions.forEach(session => {
      this.sessions.set(session.token, session);
      this.sessionIdCounter = Math.max(this.sessionIdCounter, session.id + 1);
    });

    // Create default admin user if none exists
    if (this.users.size === 0) {
      await this.createUser({
        username: 'admin',
        password: 'admin123', // In a real app, this would be hashed
        isAdmin: true
      });
    }
  }

  private async saveUsers() {
    await saveData(Array.from(this.users.values()), USERS_FILE);
  }

  private async saveTelegramUsers() {
    await saveData(Array.from(this.telegramUsers.values()), TELEGRAM_USERS_FILE);
  }

  private async saveWithdrawalRequests() {
    await saveData(Array.from(this.withdrawalRequests.values()), WITHDRAWAL_REQUESTS_FILE);
  }

  private async saveSessions() {
    await saveData(Array.from(this.sessions.values()), SESSIONS_FILE);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    // Ensure isAdmin is explicitly set to avoid type errors
    const isAdmin = insertUser.isAdmin ?? false;
    const user: User = { ...insertUser, id, isAdmin };
    this.users.set(id, user);
    await this.saveUsers();
    return user;
  }

  // Session methods
  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = this.sessionIdCounter++;
    const session: Session = { ...insertSession, id };
    this.sessions.set(session.token, session);
    await this.saveSessions();
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    return this.sessions.get(token);
  }

  async deleteSession(token: string): Promise<void> {
    this.sessions.delete(token);
    await this.saveSessions();
  }

  // Telegram user methods
  async getTelegramUser(telegramId: string): Promise<TelegramUser | undefined> {
    return this.telegramUsers.get(telegramId);
  }

  async createTelegramUser(insertUser: InsertTelegramUser): Promise<TelegramUser> {
    const id = this.telegramUserIdCounter++;
    // Set default values for nullable fields
    const user: TelegramUser = { 
      ...insertUser, 
      id,
      username: insertUser.username ?? null,
      lastName: insertUser.lastName ?? null,
      balance: insertUser.balance ?? 0,
      referrerId: insertUser.referrerId ?? null,
      referralCount: insertUser.referralCount ?? 0,
      hasJoinedGroups: insertUser.hasJoinedGroups ?? false,
      lastBonusClaim: insertUser.lastBonusClaim ?? null,
      bankAccountNumber: insertUser.bankAccountNumber ?? null,
      bankName: insertUser.bankName ?? null,
      bankAccountName: insertUser.bankAccountName ?? null
    };
    this.telegramUsers.set(user.telegramId, user);
    await this.saveTelegramUsers();
    return user;
  }

  async updateTelegramUser(telegramId: string, updates: Partial<TelegramUser>): Promise<TelegramUser | undefined> {
    const user = this.telegramUsers.get(telegramId);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.telegramUsers.set(telegramId, updatedUser);
    await this.saveTelegramUsers();
    return updatedUser;
  }

  async getAllTelegramUsers(): Promise<TelegramUser[]> {
    return Array.from(this.telegramUsers.values());
  }

  async getTelegramUsersByReferrerId(referrerId: string): Promise<TelegramUser[]> {
    return Array.from(this.telegramUsers.values()).filter(
      user => user.referrerId === referrerId
    );
  }

  async getTelegramUserCount(): Promise<number> {
    return this.telegramUsers.size;
  }

  // Withdrawal request methods
  async createWithdrawalRequest(insertRequest: InsertWithdrawalRequest): Promise<WithdrawalRequest> {
    const id = this.withdrawalRequestIdCounter++;
    // Ensure status is set explicitly to avoid type errors
    const status = insertRequest.status || 'pending';
    const request: WithdrawalRequest = { 
      ...insertRequest, 
      id,
      status
    };
    this.withdrawalRequests.set(id, request);
    await this.saveWithdrawalRequests();
    return request;
  }

  async getWithdrawalRequestsByTelegramId(telegramId: string): Promise<WithdrawalRequest[]> {
    return Array.from(this.withdrawalRequests.values()).filter(
      request => request.telegramUserId === telegramId
    );
  }

  async getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    return Array.from(this.withdrawalRequests.values());
  }

  async updateWithdrawalRequestStatus(id: number, status: string): Promise<WithdrawalRequest | undefined> {
    const request = this.withdrawalRequests.get(id);
    if (!request) return undefined;

    const updatedRequest = { ...request, status };
    this.withdrawalRequests.set(id, updatedRequest);
    await this.saveWithdrawalRequests();
    return updatedRequest;
  }

  async getTotalWithdrawalAmount(): Promise<number> {
    return Array.from(this.withdrawalRequests.values())
      .filter(request => request.status === 'approved')
      .reduce((total, request) => total + request.amount, 0);
  }
  
  // System operations
  async resetAllData(): Promise<void> {
    // Keep admin users but reset everything else
    this.telegramUsers.clear();
    this.withdrawalRequests.clear();
    
    // Reset counters (except for admin users)
    this.telegramUserIdCounter = 1;
    this.withdrawalRequestIdCounter = 1;
    
    // Save empty data
    await this.saveTelegramUsers();
    await this.saveWithdrawalRequests();
    
    console.log('All data has been reset successfully');
  }
  
  // Reset only withdrawal requests, preserve Telegram users
  async resetWithdrawalRequests(): Promise<void> {
    // Clear only withdrawal requests
    this.withdrawalRequests.clear();
    
    // Reset only withdrawal requests counter
    this.withdrawalRequestIdCounter = 1;
    
    // Save empty withdrawal requests data
    await this.saveWithdrawalRequests();
    
    console.log('Withdrawal requests have been reset successfully');
  }
}

export const storage = new MemStorage();
