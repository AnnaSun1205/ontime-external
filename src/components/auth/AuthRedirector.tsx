import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const PUBLIC_PATHS = new Set(["/", "/login", "/signup"]);

export function AuthRedirector() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);

  const isPublicPath = useMemo(() => PUBLIC_PATHS.has(location.pathname), [location.pathname]);

  // Initialize auth state + listen for changes (listener FIRST to avoid missing events)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
    });

    (async () => {
      // If OAuth ever returns to a public page (e.g. Site URL misconfig),
      // exchange the code here so we can still route into the app.
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    })();

    return () => subscription.unsubscribe();
  }, []);

  // If user is signed in and on a public page, route them into the app.
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || !isPublicPath) return;

    const route = async () => {
      const { data: preferences } = await supabase
        .from("user_preferences")
        .select("has_onboarded, selected_companies")
        .eq("user_id", userId)
        .maybeSingle();

      if (preferences?.has_onboarded && (preferences?.selected_companies?.length ?? 0) > 0) {
        navigate("/app", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    };

    route();
  }, [session?.user?.id, isPublicPath, navigate]);

  return null;
}
