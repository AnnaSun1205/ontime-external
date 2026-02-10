import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Calendar, Bell, Briefcase, User, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const navItems = [
  { href: "/app", icon: Calendar, label: "Calendar" },
  { href: "/app/listings", icon: Briefcase, label: "Listings" },
  { href: "/app/inbox", icon: Bell, label: "Inbox" },
  { href: "/app/settings", icon: User, label: "Profile" },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  // Protect /app routes: if user is not authenticated, redirect to /login
  useEffect(() => {
    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session?.user) {
        navigate("/login", { replace: true });
      } else {
        if (!cancelled) setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/login", { replace: true });
      } else {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Failed to sign out");
        setSigningOut(false);
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      toast.error("Failed to sign out");
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <Logo size="sm" />
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === item.href
                    ? "bg-secondary text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <button 
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 disabled:opacity-50"
          >
            {signingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            Sign out
          </button>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-3 px-4 text-xs font-medium transition-colors",
                location.pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="container py-8 pb-24 md:pb-8">
        <Outlet />
      </main>
    </div>
  );
}