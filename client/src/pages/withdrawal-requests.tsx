import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, XCircle, Calendar, Banknote, User, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WithdrawalRequest {
  id: number;
  telegramUserId: string;
  amount: number;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  bankAccountNumber: string;
  bankName: string;
  bankAccountName: string;
  user?: {
    telegramId: string;
    firstName: string;
    lastName?: string;
    username?: string;
    balance: number;
    bankAccountNumber?: string;
    bankName?: string;
    bankAccountName?: string;
  };
}

export default function WithdrawalRequests() {
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject' | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<WithdrawalRequest[]>({
    queryKey: ['/api/admin/withdrawal-requests'],
  });

  const updateWithdrawalMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const response = await apiRequest('POST', '/api/admin/withdrawal-requests/update', { id, status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/withdrawal-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
      
      toast({
        title: 'Success',
        description: `Withdrawal request has been ${dialogAction === 'approve' ? 'approved' : 'rejected'}.`,
      });
      
      setSelectedRequest(null);
      setDialogAction(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to ${dialogAction} withdrawal: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  const handleAction = (action: 'approve' | 'reject') => {
    if (selectedRequest) {
      updateWithdrawalMutation.mutate({
        id: selectedRequest.id,
        status: action === 'approve' ? 'approved' : 'rejected',
      });
    }
  };

  const columns = [
    {
      key: 'user',
      header: 'User',
      cell: (row: WithdrawalRequest) => (
        <div>
          <div className="font-medium">{row.user?.firstName} {row.user?.lastName || ''}</div>
          <div className="text-xs text-gray-500">ID: {row.telegramUserId}</div>
        </div>
      ),
    },
    {
      key: 'bankDetails',
      header: 'Bank Details',
      cell: (row: WithdrawalRequest) => (
        <div className="space-y-1 py-1">
          <div className="text-sm font-medium">
            Name: {row.bankAccountName}
          </div>
          <div className="text-sm font-medium">
            Bank: {row.bankName}
          </div>
          <div className="text-sm font-medium">
            Account: {row.bankAccountNumber}
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (row: WithdrawalRequest) => (
        <span className="font-medium text-green-600 dark:text-green-500">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      cell: (row: WithdrawalRequest) => (
        <span className="text-sm text-gray-500">
          {new Date(row.createdAt).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row: WithdrawalRequest) => {
        let badgeProps = {
          variant: 'outline' as const,
          className: '',
        };

        switch (row.status) {
          case 'approved':
            badgeProps.className = 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
            break;
          case 'rejected':
            badgeProps.className = 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
            break;
          default:
            badgeProps.className = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
        }

        return (
          <Badge {...badgeProps}>
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (row: WithdrawalRequest) => (
        <div className="flex gap-2">
          {row.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-green-600 border-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRequest(row);
                  setDialogAction('approve');
                }}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRequest(row);
                  setDialogAction('reject');
                }}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <AdminLayout title="Withdrawal Requests">
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-500 dark:text-red-300">
          Failed to load withdrawal requests: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Withdrawal Requests">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <DataTable
          data={data || []}
          columns={columns}
          searchField="bankAccountName"
          onRowClick={(row) => setSelectedRequest(row)}
        />
      )}

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedRequest && !!dialogAction} onOpenChange={() => {
        setSelectedRequest(null);
        setDialogAction(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === 'approve' ? 'Approve Withdrawal' : 'Reject Withdrawal'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {dialogAction} this withdrawal request?
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6 py-3">
              {/* User Information */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                <div className="text-sm font-semibold mb-3 flex items-center text-blue-600 dark:text-blue-400">
                  <User className="w-4 h-4 mr-2" /> User Information
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">Full Name</div>
                    <div className="font-medium">
                      {selectedRequest.user?.firstName || ''} {selectedRequest.user?.lastName || ''}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">Telegram ID</div>
                    <div className="font-mono text-sm">
                      {selectedRequest.telegramUserId}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payment Information */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                <div className="text-sm font-semibold mb-3 flex items-center text-green-600 dark:text-green-400">
                  <CreditCard className="w-4 h-4 mr-2" /> Payment Information
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">Amount</div>
                    <div className="font-bold text-green-600 dark:text-green-500">
                      {formatCurrency(selectedRequest.amount)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500">Account Details:</div>
                    <div className="font-medium">
                      Name: {selectedRequest.bankAccountName}
                    </div>
                    <div className="font-medium">
                      Bank: {selectedRequest.bankName}
                    </div>
                    <div className="font-medium">
                      Account: {selectedRequest.bankAccountNumber}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">Request Date</div>
                    <div>
                      {new Date(selectedRequest.createdAt).toLocaleDateString('en-NG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setDialogAction(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={dialogAction === 'approve' ? 'default' : 'destructive'}
              onClick={() => handleAction(dialogAction!)}
              disabled={updateWithdrawalMutation.isPending}
            >
              {updateWithdrawalMutation.isPending ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                dialogAction === 'approve' ? 'Approve' : 'Reject'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
