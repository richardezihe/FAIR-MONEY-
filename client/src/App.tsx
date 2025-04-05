import { Switch, Route, useLocation, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import WithdrawalRequests from "@/pages/withdrawal-requests";
import AllUsers from "@/pages/all-users";
import { useAuth } from "@/lib/auth";
import { ROUTES } from "@shared/constants";
import { Skeleton } from "@/components/ui/skeleton";

// Protected route component
const ProtectedRoute = ({ component: Component, ...rest }: any) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Show loading state while checking authentication
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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    setLocation(ROUTES.LOGIN);
    return null;
  }

  // Render the component if authenticated
  return <Component {...rest} />;
};

function Router() {
  return (
    <Switch>
      <Route path={ROUTES.LOGIN} component={Login} />
      <Route path={ROUTES.DASHBOARD}>
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path={ROUTES.WITHDRAWAL_REQUESTS}>
        <ProtectedRoute component={WithdrawalRequests} />
      </Route>
      <Route path={ROUTES.ALL_USERS}>
        <ProtectedRoute component={AllUsers} />
      </Route>
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
