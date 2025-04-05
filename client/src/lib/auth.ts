import { useState, useEffect } from 'react';
import { apiRequest } from './queryClient';
import { useToast } from '@/hooks/use-toast';
import { ROUTES } from '@shared/constants';
import { useLocation } from 'wouter';

// User type
export interface User {
  id: number;
  username: string;
  isAdmin: boolean;
}

// Auth state
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// Local storage keys
const TOKEN_KEY = 'fairmoneyapp_token';

// Function to get token from localStorage
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Function to set token in localStorage
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

// Function to remove token from localStorage
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Hook for handling authentication
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: getToken(),
    isLoading: true,
    error: null,
  });
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  // Check if user is authenticated on initial load
  useEffect(() => {
    async function fetchCurrentUser() {
      const token = getToken();
      if (!token) {
        setAuthState({
          user: null,
          token: null,
          isLoading: false,
          error: null,
        });
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Authentication failed');
        }

        const data = await res.json();
        setAuthState({
          user: data.user,
          token,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        removeToken();
        setAuthState({
          user: null,
          token: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Authentication failed',
        });
      }
    }

    fetchCurrentUser();
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Use direct fetch for more control over the response
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        // If login failed, throw an error
        const errorData = await res.json();
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const data = await res.json();

      setToken(data.token);
      setAuthState({
        user: data.user,
        token: data.token,
        isLoading: false,
        error: null,
      });

      toast({
        title: 'Logged in successfully',
        description: `Welcome back, ${data.user.username}!`,
      });

      // Redirect to dashboard
      navigate(ROUTES.DASHBOARD);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));

      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      if (authState.token) {
        await apiRequest('POST', '/api/auth/logout', {});
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    removeToken();
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });

    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully',
    });

    navigate(ROUTES.LOGIN);
  };

  return {
    ...authState,
    login,
    logout,
    isAuthenticated: !!authState.user,
    isAdmin: authState.user?.isAdmin || false,
  };
}
