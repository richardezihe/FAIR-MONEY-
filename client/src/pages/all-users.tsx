import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Users, DollarSign, UserPlus } from 'lucide-react';

interface TelegramUser {
  id: number;
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  joinedAt: string;
  balance: number;
  referrerId?: string;
  referralCount: number;
  hasJoinedGroups: boolean;
  lastBonusClaim?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankAccountName?: string;
}

export default function AllUsers() {
  const { data, isLoading, error } = useQuery<TelegramUser[]>({
    queryKey: ['/api/admin/users'],
  });

  const columns = [
    {
      key: 'user',
      header: 'User',
      cell: (row: TelegramUser) => (
        <div>
          <div className="font-medium">{row.firstName} {row.lastName || ''}</div>
          <div className="text-xs text-gray-500">
            {row.username ? `@${row.username}` : `ID: ${row.telegramId}`}
          </div>
        </div>
      ),
    },
    {
      key: 'balance',
      header: 'Balance',
      cell: (row: TelegramUser) => (
        <span className="font-medium text-green-600 dark:text-green-500">
          {formatCurrency(row.balance)}
        </span>
      ),
    },
    {
      key: 'referrals',
      header: 'Referrals',
      cell: (row: TelegramUser) => row.referralCount,
    },
    {
      key: 'bankDetails',
      header: 'Bank Details',
      cell: (row: TelegramUser) => (
        <div>
          {row.bankAccountNumber ? (
            <>
              <div className="font-medium">{row.bankName}</div>
              <div className="text-xs text-gray-500">{row.bankAccountNumber}</div>
              <div className="text-xs text-gray-500">{row.bankAccountName}</div>
            </>
          ) : (
            <span className="text-xs text-gray-500">Not set</span>
          )}
        </div>
      ),
    },
    {
      key: 'joinedAt',
      header: 'Joined',
      cell: (row: TelegramUser) => (
        <span className="text-sm text-gray-500">
          {new Date(row.joinedAt).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'lastActive',
      header: 'Last Active',
      cell: (row: TelegramUser) => (
        <span className="text-sm text-gray-500">
          {row.lastBonusClaim ? new Date(row.lastBonusClaim).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }) : 'N/A'}
        </span>
      ),
    },
  ];

  // Calculate stats
  const totalUsers = data?.length || 0;
  const totalBalance = data?.reduce((total, user) => total + user.balance, 0) || 0;
  const totalReferrals = data?.reduce((total, user) => total + user.referralCount, 0) || 0;

  if (error) {
    return (
      <AdminLayout title="All Users">
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-500 dark:text-red-300">
          Failed to load users: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="All Users">
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            {/* Total Users Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Registered Users</CardTitle>
                <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Telegram bot users
                </p>
              </CardContent>
            </Card>

            {/* Total Balance Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                  {formatCurrency(totalBalance)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Combined user balances
                </p>
              </CardContent>
            </Card>

            {/* Total Referrals Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <UserPlus className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalReferrals}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Successful invites
                </p>
              </CardContent>
            </Card>
          </div>

          <DataTable
            data={data || []}
            columns={columns}
            searchField="firstName"
          />
        </>
      )}
    </AdminLayout>
  );
}
