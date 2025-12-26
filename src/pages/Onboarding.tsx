import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Onboarding() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/signup", { replace: true });
        return;
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [navigate]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-white py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <Logo className="justify-center mb-6" />
          <h1 className="text-2xl font-bold mb-2">Welcome to OnTime!</h1>
          <p className="text-muted-foreground">Your onboarding flow will be set up here.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
          <p className="text-muted-foreground mb-6">
            The full onboarding experience (selecting seasons, roles, companies) will be migrated in the next step.
          </p>
          <Button onClick={() => navigate("/")}>
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}
