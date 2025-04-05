import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, DollarSign, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

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
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                `Active users: ${data?.actualUsers.toLocaleString()}`
              )}
            </p>
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
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                `Actual payouts: ${formatCurrency(data?.actualPayouts || 0)}`
              )}
            </p>
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
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Waiting for approval
            </p>
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
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              New users in last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Welcome card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Welcome to FAIR MONEY Admin Dashboard</CardTitle>
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
