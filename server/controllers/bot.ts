import { Request, Response } from 'express';
import { storage } from '../storage';
import { formatCurrency } from '../utils';
import { DEFAULT_STATS } from '@shared/constants';

// Webhook handler for the bot
export async function handleWebhook(req: Request, res: Response) {
  try {
    // This is just a placeholder - the actual bot logic is in bot.ts
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get bot statistics
export async function getBotStats(req: Request, res: Response) {
  try {
    const userCount = await storage.getTelegramUserCount();
    const totalPayout = await storage.getTotalWithdrawalAmount();
    
    // Return statistics using the fake numbers as required
    res.status(200).json({
      totalUsers: DEFAULT_STATS.TOTAL_USERS,
      totalPayouts: formatCurrency(DEFAULT_STATS.TOTAL_PAYOUTS),
      actualUsers: userCount,
      actualPayouts: formatCurrency(totalPayout)
    });
  } catch (error) {
    console.error('Get bot stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Submit a withdrawal request
export async function submitWithdrawal(req: Request, res: Response) {
  try {
    const { telegramId, amount } = req.body;
    
    if (!telegramId || !amount) {
      return res.status(400).json({ message: 'Invalid withdrawal data' });
    }
    
    const user = await storage.getTelegramUser(telegramId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.bankAccountNumber || !user.bankName || !user.bankAccountName) {
      return res.status(400).json({ message: 'Bank details not set' });
    }
    
    // Create withdrawal request
    const withdrawalRequest = await storage.createWithdrawalRequest({
      telegramUserId: telegramId,
      amount: Number(amount),
      createdAt: new Date(),
      status: 'pending',
      bankAccountNumber: user.bankAccountNumber,
      bankName: user.bankName,
      bankAccountName: user.bankAccountName
    });
    
    res.status(201).json(withdrawalRequest);
  } catch (error) {
    console.error('Submit withdrawal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
