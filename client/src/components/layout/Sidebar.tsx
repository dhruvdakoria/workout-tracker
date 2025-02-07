import { Link, useLocation } from "wouter";
import { Dumbbell, BarChart2, PlusCircle, LogOut, User, LayoutDashboard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Sidebar() {
  const [location, navigate] = useLocation();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
  });

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate('/login');
    }
  };

  const links = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/log", icon: PlusCircle, label: "Log Workout" },
    { href: "/progress", icon: BarChart2, label: "Progress" },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-background border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <Link href="/">
          <a className="text-2xl font-bold hover:text-primary transition-colors flex items-center gap-2">
            <Dumbbell className="h-6 w-6" />
            Workout Tracker
          </a>
        </Link>
      </div>

      <nav className="flex-1 px-2 py-4">
        {links.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}>
            <a
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                location === href
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground hover:bg-accent/50"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </a>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center gap-2 justify-start">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium leading-none">{user?.email}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}