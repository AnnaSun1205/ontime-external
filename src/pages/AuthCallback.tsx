import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Completing sign in...");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          navigate("/login?error=auth_failed");
          return;
        }

        if (!session?.user) {
          console.error("No session found");
          navigate("/login?error=no_session");
          return;
        }

        setStatus("Checking your account...");

        const { data: preferences, error: prefError } = await supabase
          .from("user_preferences")
          .select("has_onboarded, selected_companies")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (prefError) {
          console.error("Error checking preferences:", prefError);
        }

        const provider = session.user.app_metadata?.provider || "unknown";

        if (preferences) {
          await supabase
            .from("user_preferences")
            .update({
              last_login: new Date().toISOString(),
              auth_provider: provider,
            })
            .eq("user_id", session.user.id);
        }

        if (preferences?.has_onboarded && preferences?.selected_companies?.length > 0) {
          setStatus("Loading your dashboard...");
          navigate("/app", { replace: true });
        } else {
          setStatus("Setting up your account...");
          navigate("/onboarding", { replace: true });
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        navigate("/login?error=callback_failed");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-sky-100 to-white">
      <Logo className="mb-8" />
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
