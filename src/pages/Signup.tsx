import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate("/onboarding", { replace: true });
      } else {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setLoading("google");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) { toast.error(error.message); setLoading(null); }
    } catch { toast.error("Failed to sign up with Google."); setLoading(null); }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = signupSchema.safeParse({ email, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string; confirmPassword?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
        if (err.path[0] === "confirmPassword") fieldErrors.confirmPassword = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading("email");
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        toast.error(error.message.includes("already registered") ? "Email already registered. Please sign in." : error.message);
        setLoading(null);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        toast.success("Account created!");
        navigate("/onboarding", { replace: true });
      } else {
        toast.success("Check your email to confirm.");
        navigate("/login", { replace: true });
      }
    } catch { toast.error("Failed to create account."); setLoading(null); }
  };

  if (checkingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-white"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-sky-100 to-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6"><Logo /></Link>
          <h1 className="text-2xl font-bold mb-2">Create your account</h1>
          <p className="text-sm text-muted-foreground">Start tracking internship applications</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {!showEmailForm ? (
            <div className="space-y-4">
              <Button type="button" variant="oauth" className="w-full h-12" onClick={handleGoogleSignIn} disabled={loading !== null}>
                {loading === "google" ? "Creating account..." : "Continue with Google"}
              </Button>
              <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div></div>
              <Button type="button" variant="outline" className="w-full h-12" onClick={() => setShowEmailForm(true)} disabled={loading !== null}><Mail className="w-5 h-5 mr-2" />Continue with Email</Button>
            </div>
          ) : (
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading !== null} className={errors.email ? "border-destructive" : ""} />{errors.email && <p className="text-sm text-destructive">{errors.email}</p>}</div>
              <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading !== null} className={errors.password ? "border-destructive" : ""} />{errors.password && <p className="text-sm text-destructive">{errors.password}</p>}</div>
              <div className="space-y-2"><Label htmlFor="confirmPassword">Confirm Password</Label><Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading !== null} className={errors.confirmPassword ? "border-destructive" : ""} />{errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}</div>
              <Button type="submit" className="w-full h-12" disabled={loading !== null}>{loading === "email" ? "Creating account..." : "Create account"}</Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setShowEmailForm(false)} disabled={loading !== null}>Back</Button>
            </form>
          )}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-6">Already have an account? <Link to="/login" className="text-foreground font-medium hover:underline">Sign in</Link></p>
      </div>
    </div>
  );
}
