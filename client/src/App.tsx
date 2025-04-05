import { Switch, Route, useLocation, Redirect } from "wouter";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import WithdrawalRequests from "@/pages/withdrawal-requests";
import AllUsers from "@/pages/all-users";
import { useAuth } from "@/lib/auth";
import { ROUTES } from "@shared/constants";
import { Skeleton } from "@/components/ui/skeleton";

// Protected route component to handle authentication
function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  // Handle redirection when auth state changes
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(ROUTES.LOGIN);
    }
  }, [isLoading, isAuthenticated, navigate]);
  
  // Show loading indicator while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="w-full max-w-md space-y-4 p-4">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }
  
  // Don't render anything while redirecting
  if (!isAuthenticated) {
    return null;
  }
  
  // Render the component when authenticated
  return <Component />;
}

function Router() {
  const { isLoading } = useAuth();
  
  // Show loading indicator while auto-authentication is happening
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="w-full max-w-md space-y-4 p-4">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }
  
  return (
    <Switch>
      {/* Direct dashboard access - login page no longer needed */}
      <Route path={ROUTES.DASHBOARD} component={Dashboard} />
      <Route path={ROUTES.WITHDRAWAL_REQUESTS} component={WithdrawalRequests} />
      <Route path={ROUTES.ALL_USERS} component={AllUsers} />
      <Route path="/">
        <Redirect to={ROUTES.DASHBOARD} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
