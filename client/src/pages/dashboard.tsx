import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, DollarSign, Clock, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DashboardStats {
  totalUsers: number;
  totalPayouts: number;
  actualUsers: number;
  actualPayouts: number;
  pendingWithdrawals: number;
  recentUsers: number;
}

export default function Dashboard() {
  const { data, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/dashboard'],
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  
  const resetDataMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/admin/reset');
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Requests Reset",
        description: "All withdrawal requests have been cleared while preserving user data.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/withdrawals'] });
      setIsResetDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Reset Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  if (error) {
    return (
      <AdminLayout title="Dashboard">
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-500 dark:text-red-300">
          Failed to load dashboard data: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{data?.totalUsers.toLocaleString()}</div>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                `Active users: ${data?.actualUsers.toLocaleString()}`
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Payouts Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                {formatCurrency(data?.totalPayouts || 0)}
              </div>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                `Actual payouts: ${formatCurrency(data?.actualPayouts || 0)}`
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Withdrawals Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
            <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
                {data?.pendingWithdrawals || 0}
              </div>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Waiting for approval
            </div>
          </CardContent>
        </Card>

        {/* Recent Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Users</CardTitle>
            <Activity className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">{data?.recentUsers || 0}</div>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              New users in last 30 days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Welcome card */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Welcome to FAIR MONEY Admin Dashboard</CardTitle>
          <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900 gap-1">
                <RotateCcw className="h-4 w-4" />
                Reset Withdrawal Requests
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Withdrawal Requests</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete all withdrawal requests while preserving Telegram user data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent default to handle manually
                    resetDataMutation.mutate();
                  }}
                  disabled={resetDataMutation.isPending}
                >
                  {resetDataMutation.isPending ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Resetting...
                    </span>
                  ) : "Reset Withdrawals"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardHeader>
        <CardContent className="text-gray-500 dark:text-gray-400">
          <p>
            This dashboard provides an overview of your FAIR MONEY Telegram bot. Here you can:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Monitor all user activities</li>
            <li>Process withdrawal requests</li>
            <li>View and manage user accounts</li>
            <li>Track system statistics</li>
          </ul>
          <p className="mt-4">
            Use the navigation menu to access different sections of the dashboard.
          </p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
