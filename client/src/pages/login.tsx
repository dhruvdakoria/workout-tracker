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

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

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

          // Check if user record exists in our users table
          const { data: existingUser } = await supabase
            .from('users')
            .select()
            .eq('id', session.user.id)
            .single();

          // If user record doesn't exist, create it
          if (!existingUser) {
            const { error: profileError } = await supabase
              .from('users')
              .insert([
                {
                  id: session.user.id,
                  email: session.user.email!,
                  name: session.user.user_metadata.name || 'User',
                }
              ]);

            if (profileError) throw profileError;
          }

          toast({
            title: "Success",
            description: "Email confirmed successfully. You can now log in.",
          });

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
  }, [toast]);

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

      // Check if email is confirmed
      if (!user.email_confirmed_at) {
        throw new Error('Please confirm your email address before logging in');
      }

      // Check if user record exists in our users table
      const { data: existingUser } = await supabase
        .from('users')
        .select()
        .eq('id', user.id)
        .single();

      // If user record doesn't exist, create it
      if (!existingUser) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: user.id,
              email: user.email!,
              name: user.user_metadata.name || 'User',
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