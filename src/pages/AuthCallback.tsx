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
        // Check if there's an auth code in the URL (OAuth callback)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        const accessToken = hashParams.get("access_token");
        const code = queryParams.get("code");
        
        let session = null;
        
        if (code) {
          // Exchange code for session (PKCE flow)
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("Code exchange error:", error);
            navigate("/login?error=auth_failed", { replace: true });
            return;
          }
          session = data.session;
        } else if (accessToken) {
          // Implicit flow - session should be set automatically
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.error("Session error:", error);
            navigate("/login?error=auth_failed", { replace: true });
            return;
          }
          session = data.session;
        } else {
          // No auth params, try to get existing session
          const { data, error } = await supabase.auth.getSession();
          if (error || !data.session) {
            console.error("No session found");
            navigate("/login?error=no_session", { replace: true });
            return;
          }
          session = data.session;
        }

        if (!session?.user) {
          console.error("No user in session");
          navigate("/login?error=no_session", { replace: true });
          return;
        }

        setStatus("Checking your account...");

        // Check if user has completed onboarding
        const { data: preferences, error: prefError } = await supabase
          .from("user_preferences")
          .select("has_onboarded, selected_companies")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (prefError) {
          console.error("Error checking preferences:", prefError);
        }

        // Update last login and auth provider
        const provider = session.user.app_metadata?.provider || "unknown";
        
        if (preferences) {
          // Update existing record
          await supabase
            .from("user_preferences")
            .update({ 
              last_login: new Date().toISOString(),
              auth_provider: provider,
            })
            .eq("user_id", session.user.id);
        }

        // Route based on onboarding status
        if (preferences?.has_onboarded && preferences?.selected_companies?.length > 0) {
          setStatus("Loading your dashboard...");
          navigate("/app", { replace: true });
        } else {
          setStatus("Setting up your account...");
          navigate("/onboarding", { replace: true });
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        navigate("/login?error=callback_failed", { replace: true });
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
