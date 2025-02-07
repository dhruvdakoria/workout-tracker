import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import LogWorkout from "@/pages/log-workout";
import Progress from "@/pages/progress";
import Login from "@/pages/login";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useTheme, applyTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  const { theme } = useTheme();

  const { data: session, isLoading } = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
  });

  useEffect(() => {
    if (!isLoading && !session) {
      navigate("/login");
    }
  }, [session, isLoading, navigate]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? <MobileNav /> : <Sidebar />}
      <main className={cn(
        "min-h-screen transition-all duration-200 ease-in-out",
        isMobile 
          ? "pt-16 px-4" 
          : "ml-64 p-8"
      )}>
        <div className="max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        {() => (
          <AuthenticatedLayout>
            <Dashboard />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route path="/log">
        {() => (
          <AuthenticatedLayout>
            <LogWorkout />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route path="/progress">
        {() => (
          <AuthenticatedLayout>
            <Progress />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route>
        {() => (
          <AuthenticatedLayout>
            <NotFound />
          </AuthenticatedLayout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;