import { Request, Response } from 'express';
import { storage } from '../storage';
import { DEFAULT_STATS } from '@shared/constants';

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
            balance: user.balance
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
    
    // If approved, update user balance
    if (status === 'approved') {
      const user = await storage.getTelegramUser(updatedRequest.telegramUserId);
      if (user) {
        await storage.updateTelegramUser(user.telegramId, {
          balance: Math.max(0, user.balance - updatedRequest.amount)
        });
      }
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
