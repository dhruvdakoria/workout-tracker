import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { User } from '@supabase/supabase-js';

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  // Handle OAuth callbacks (Google sign-in)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        if (!session) return; // No session yet
        
        const { user } = session;
        if (!user) return;

        // Handle successful authentication
        await handleSuccessfulAuth(user);
      } catch (error) {
        console.error('OAuth callback error:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to complete sign in",
          variant: "destructive",
        });
      }
    };

    handleOAuthCallback();
  }, []);

  // Handle email confirmation
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        try {
          // Get the session after email confirmation
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (!session?.user) throw new Error('No user found');

          // Get user details to check email confirmation
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
          if (!user?.email_confirmed_at) {
            throw new Error('Email not confirmed yet');
          }

          await handleSuccessfulAuth(user);

          // Clear the hash from URL
          window.location.hash = '';
        } catch (error) {
          console.error('Confirmation error:', error);
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to confirm email",
            variant: "destructive",
          });
        }
      }
    };

    handleEmailConfirmation();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Sign in the user
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      if (!user) throw new Error('No user returned after login');

      await handleSuccessfulAuth(user);
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Google sign in error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sign in with Google",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Shared success handler
  const handleSuccessfulAuth = async (user: User) => {
    try {
      // Check if user record exists in our users table
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select()
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw fetchError;
      }

      // If user record doesn't exist, create it
      if (!existingUser) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: user.id,
              email: user.email!,
              name: user.user_metadata.name || user.user_metadata.full_name || 'User',
            }
          ]);

        if (profileError) throw profileError;
      }

      // Force a refresh of the auth state
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
      
      // Wait for the session to be established
      const waitForSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // If no session, wait a bit and try again
          await new Promise(resolve => setTimeout(resolve, 100));
          return waitForSession();
        }
        return session;
      };

      await waitForSession();
      
      toast({
        title: "Success",
        description: "Logged in successfully",
      });

      // Navigate immediately after session is confirmed
      navigate("/");
    } catch (error) {
      console.error('Auth success handler error:', error);
      throw error; // Re-throw to be handled by the caller
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate password length
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Sign up the user
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error('No user returned after signup');

      // Note: We'll create the user record after email confirmation
      toast({
        title: "Success",
        description: "Please check your email to confirm your account. You can close this tab.",
      });

      // Clear the form
      setEmail("");
      setPassword("");
      setName("");
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sign up",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Workout Tracker</CardTitle>
          <CardDescription>Sign in to your account or create a new one</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please wait
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password (min. 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 