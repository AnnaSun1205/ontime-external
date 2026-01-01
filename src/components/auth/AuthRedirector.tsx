import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const AUTH_IN_PROGRESS_KEY = "ontime-auth-in-progress";
const LANDING_PATH = "/";
const AUTH_PAGES = new Set(["/login", "/signup"]);

function hasOAuthParams() {
  const code = new URLSearchParams(window.location.search).get("code");
  const hash = window.location.hash ?? "";
  return Boolean(
    code ||
      hash.includes("access_token=") ||
      hash.includes("refresh_token=") ||
      hash.includes("error=")
  );
}

export function AuthRedirector() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);

  const isLanding = location.pathname === LANDING_PATH;
  const isAuthPage = useMemo(() => AUTH_PAGES.has(location.pathname), [location.pathname]);

  const shouldAutoRedirect = useMemo(() => {
    if (isLanding) return true;

    // Only auto-redirect away from /login & /signup if the user is coming back from an OAuth flow
    // (so the only manual exit remains the "Back home" button).
    if (!isAuthPage) return false;

    const authInProgress = sessionStorage.getItem(AUTH_IN_PROGRESS_KEY) === "1";
    return authInProgress || hasOAuthParams();
  }, [isLanding, isAuthPage]);

  // Initialize auth state + listen for changes (listener FIRST to avoid missing events)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
    });

    let cancelled = false;

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!cancelled) setSession(data.session);
      return data.session;
    };

    (async () => {
      // If OAuth ever returns to a public page (e.g. Site URL misconfig),
      // exchange the code here so we can still route into the app.
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      // Initial pull
      let current = await syncSession();

      // If we have OAuth params but no session yet, poll briefly (race condition protection)
      if (!current && hasOAuthParams()) {
        for (let i = 0; i < 12; i++) {
          await new Promise((r) => setTimeout(r, 250));
          current = await syncSession();
          if (current) break;
        }
      }
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // If user is signed in and should auto-redirect on this page, route them into the app.
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || !shouldAutoRedirect) return;

    const route = async () => {
      const { data: preferences } = await supabase
        .from("user_preferences")
        .select("has_onboarded, selected_companies")
        .eq("user_id", userId)
        .maybeSingle();

      sessionStorage.removeItem(AUTH_IN_PROGRESS_KEY);

      if (preferences?.has_onboarded && (preferences?.selected_companies?.length ?? 0) > 0) {
        navigate("/app", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    };

    route();
  }, [session?.user?.id, shouldAutoRedirect, navigate]);

  return null;
}
