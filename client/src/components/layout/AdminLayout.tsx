import React, { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { BarChart, Users, LogOut, DollarSign, Home } from 'lucide-react';
import { ROUTES } from '@shared/constants';
import { useAuth } from '@/lib/auth';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [currentLocation] = useLocation();
  const { logout, user } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      icon: <Home className="mr-2 h-4 w-4" />,
      href: ROUTES.DASHBOARD,
    },
    {
      label: 'Withdrawal Requests',
      icon: <DollarSign className="mr-2 h-4 w-4" />,
      href: ROUTES.WITHDRAWAL_REQUESTS,
    },
    {
      label: 'All Users',
      icon: <Users className="mr-2 h-4 w-4" />,
      href: ROUTES.ALL_USERS,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <BarChart className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              FAIR MONEY Admin
            </h1>
          </div>
        </div>
        <div className="px-4 py-2">
          <p className="text-xs text-gray-500 mb-2 mt-2">MENU</p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <button
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md w-full text-left ${
                    currentLocation === item.href
                      ? 'bg-primary-50 text-primary dark:bg-primary-900 dark:text-primary-300'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mr-2">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Admin</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start text-red-500" 
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <BarChart className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">FAIR MONEY</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-5 w-5 text-gray-500" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-64">
        <main className="p-6 mt-16 md:mt-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          </div>
          {children}
        </main>

        {/* Mobile navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10">
          <div className="flex justify-around py-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <button
                  className={`flex flex-col items-center p-2 bg-transparent border-0 ${
                    currentLocation === item.href
                      ? 'text-primary'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {React.cloneElement(item.icon as React.ReactElement, { className: 'h-5 w-5 mb-1' })}
                  <span className="text-xs">{item.label}</span>
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
