import { Request, Response } from 'express';
import { storage } from '../storage';
import { DEFAULT_STATS } from '@shared/constants';
import { formatCurrency } from '../utils';
import { initBot } from '../bot';

export async function getDashboardStats(req: Request, res: Response) {
  try {
    // Get real numbers from storage
    const userCount = await storage.getTelegramUserCount();
    const totalPayout = await storage.getTotalWithdrawalAmount();
    
    // Get withdrawal requests
    const withdrawalRequests = await storage.getAllWithdrawalRequests();
    const pendingWithdrawals = withdrawalRequests.filter(r => r.status === 'pending').length;
    
    // Return dashboard statistics
    res.status(200).json({
      // Use the fake stats for total numbers as required
      totalUsers: DEFAULT_STATS.TOTAL_USERS,
      totalPayouts: DEFAULT_STATS.TOTAL_PAYOUTS,
      // Real stats from database
      actualUsers: userCount,
      actualPayouts: totalPayout,
      pendingWithdrawals,
      recentUsers: userCount > 0 ? Math.min(userCount, 50) : 0
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getWithdrawalRequests(req: Request, res: Response) {
  try {
    const withdrawalRequests = await storage.getAllWithdrawalRequests();
    
    // Get user details for each withdrawal request
    const withdrawalRequestsWithUser = await Promise.all(
      withdrawalRequests.map(async (request) => {
        const user = await storage.getTelegramUser(request.telegramUserId);
        return {
          ...request,
          user: user ? {
            telegramId: user.telegramId,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            balance: user.balance,
            bankAccountNumber: user.bankAccountNumber,
            bankName: user.bankName,
            bankAccountName: user.bankAccountName
          } : null
        };
      })
    );
    
    res.status(200).json(withdrawalRequestsWithUser);
  } catch (error) {
    console.error('Get withdrawal requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updateWithdrawalStatus(req: Request, res: Response) {
  try {
    const { id, status } = req.body;
    
    if (!id || !status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid withdrawal update data' });
    }
    
    const updatedRequest = await storage.updateWithdrawalRequestStatus(Number(id), status);
    
    if (!updatedRequest) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }
    
    // Get user data
    const user = await storage.getTelegramUser(updatedRequest.telegramUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    try {
      // Get bot token from env variables
      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (!token) {
        console.error("Missing TELEGRAM_BOT_TOKEN environment variable");
      } else {
        // Initialize the bot
        const bot = initBot(token);
        
        // Send notification based on status
        if (status === 'approved') {
          // Send approval notification
          await bot.telegram.sendMessage(
            user.telegramId,
            `🎉 Congratulations! Your withdrawal request has been APPROVED!\n\n` +
            `Amount: ${formatCurrency(updatedRequest.amount)}\n` +
            `Bank: ${updatedRequest.bankName}\n` +
            `Account: ${updatedRequest.bankAccountNumber}\n\n` +
            `Your money has been sent to your account. Thank you for using Fairmoney!`
          );
        } else if (status === 'rejected') {
          // Send rejection notification
          await bot.telegram.sendMessage(
            user.telegramId,
            `❌ Your withdrawal request has been REJECTED.\n\n` +
            `Amount: ${formatCurrency(updatedRequest.amount)}\n\n` +
            `The amount has been returned to your balance. Please contact support if you have any questions.`
          );
          
          // Return the amount to the user's balance if rejected
          await storage.updateTelegramUser(user.telegramId, {
            balance: (user.balance ?? 0) + updatedRequest.amount
          });
        }
      }
    } catch (botError) {
      console.error('Error sending notification:', botError);
      // Continue with the response even if notification fails
    }
    
    res.status(200).json(updatedRequest);
  } catch (error) {
    console.error('Update withdrawal status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await storage.getAllTelegramUsers();
    
    // Add referral counts for each user
    const usersWithReferrals = await Promise.all(
      users.map(async (user) => {
        const referrals = await storage.getTelegramUsersByReferrerId(user.telegramId);
        return {
          ...user,
          referralCount: referrals.length
        };
      })
    );
    
    res.status(200).json(usersWithReferrals);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function resetAllData(req: Request, res: Response) {
  try {
    // Only reset withdrawal requests, preserve Telegram users
    await storage.resetWithdrawalRequests();
    
    console.log('Withdrawal requests have been reset successfully');
    res.status(200).json({ message: 'Withdrawal requests have been reset successfully' });
  } catch (error) {
    console.error('Reset withdrawal requests error:', error);
    res.status(500).json({ message: 'Failed to reset withdrawal requests' });
  }
}
