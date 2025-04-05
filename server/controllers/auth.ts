import { Request, Response } from 'express';
import { storage } from '../storage';
import { LoginCredentials, loginSchema } from '@shared/schema';
import { generateToken, getSessionExpirationDate } from '../utils';
import { ZodError } from 'zod';

export async function login(req: Request, res: Response) {
  try {
    // Validate login credentials
    const credentials: LoginCredentials = loginSchema.parse(req.body);

    // Find user by username
    const user = await storage.getUserByUsername(credentials.username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Check password (in a real app, we would hash and compare passwords)
    if (user.password !== credentials.password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Create a new session
    const token = generateToken();
    const expiresAt = getSessionExpirationDate();
    
    const session = await storage.createSession({
      userId: user.id,
      token,
      createdAt: new Date(),
      expiresAt
    });

    // Return user and token
    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      },
      token,
      expiresAt
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Invalid login data', errors: error.errors });
    }
    
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await storage.deleteSession(token);
    }
    
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
