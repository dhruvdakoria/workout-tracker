import { Link, useLocation } from "wouter";
import { Dumbbell, BarChart2, PlusCircle, Menu, LogOut, User, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MobileNav() {
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
    <div className="fixed top-0 left-0 right-0 h-16 border-b bg-background flex items-center justify-between px-4 z-50">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Workout Tracker
            </SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <nav className="space-y-1">
              {links.map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href}>
                  <a
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
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
          </div>
        </SheetContent>
      </Sheet>

      <Link href="/">
        <a className="text-lg font-semibold hover:text-primary transition-colors flex items-center gap-2">
          <Dumbbell className="h-5 w-5" />
          Workout Tracker
        </a>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
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
  );
}