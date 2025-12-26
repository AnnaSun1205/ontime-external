import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: preferences } = await supabase
          .from("user_preferences")
          .select("has_onboarded, selected_companies")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (preferences?.has_onboarded && preferences?.selected_companies?.length > 0) {
          navigate("/app", { replace: true });
        } else {
          navigate("/onboarding", { replace: true });
        }
      } else {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      const errorMessages: Record<string, string> = {
        auth_failed: "Authentication failed. Please try again.",
        no_session: "Session expired. Please sign in again.",
        callback_failed: "Something went wrong. Please try again.",
      };
      toast.error(errorMessages[error] || "Login failed. Please try again.");
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setLoading("google");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error(error.message || "Failed to sign in with Google");
        setLoading(null);
      }
    } catch {
      toast.error("Failed to sign in with Google. Please try again.");
      setLoading(null);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading("email");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast.error(error.message.includes("Invalid login credentials") 
          ? "Invalid email or password." 
          : error.message);
        setLoading(null);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: preferences } = await supabase
          .from("user_preferences")
          .select("has_onboarded, selected_companies")
          .eq("user_id", session.user.id)
          .maybeSingle();

        navigate(preferences?.has_onboarded && preferences?.selected_companies?.length > 0 
          ? "/app" 
          : "/onboarding", { replace: true });
      }
    } catch {
      toast.error("Failed to sign in. Please try again.");
      setLoading(null);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-sky-100 to-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6"><Logo /></Link>
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {!showEmailForm ? (
            <div className="space-y-4">
              <Button type="button" variant="oauth" className="w-full h-12" onClick={handleGoogleSignIn} disabled={loading !== null}>
                {loading === "google" ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                {loading === "google" ? "Signing in..." : "Continue with Google"}
              </Button>
              <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div></div>
              <Button type="button" variant="outline" className="w-full h-12" onClick={() => setShowEmailForm(true)} disabled={loading !== null}>
                <Mail className="w-5 h-5 mr-2" />Continue with Email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading !== null} className={errors.email ? "border-destructive" : ""} />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading !== null} className={errors.password ? "border-destructive" : ""} />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>
              <Button type="submit" className="w-full h-12" disabled={loading !== null}>
                {loading === "email" ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Signing in...</> : "Sign in"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setShowEmailForm(false)} disabled={loading !== null}>Back</Button>
            </form>
          )}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-6">New to OnTime? <Link to="/signup" className="text-foreground font-medium hover:underline">Create an account</Link></p>
      </div>
    </div>
  );
}
