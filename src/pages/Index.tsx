import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { BubbleLogoAnimation } from "@/components/landing/BubbleLogoAnimation";
import { ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [animating, setAnimating] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const [fadeOut, setFadeOut] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;

    const redirectAuthedUser = async (userId: string) => {
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

    const checkAndRedirect = async () => {
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled && session?.user) {
        await redirectAuthedUser(session.user.id);
      }
    };

    checkAndRedirect();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setTimeout(() => {
          if (!cancelled) {
            redirectAuthedUser(session.user.id);
          }
        }, 0);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleCTAClick = () => {
    if (animating) return;
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
    setAnimating(true);
  };

  const handleAnimationComplete = useCallback(() => {
    setFadeOut(true);
    setTimeout(() => {
      navigate("/waitlist");
    }, 500);
  }, [navigate]);

  return (
    <div
      className={`min-h-screen flex flex-col transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"}`}
      style={{ background: "linear-gradient(180deg, hsl(30 30% 97%) 0%, hsl(214 100% 97%) 60%, hsl(214 95% 94%) 100%)" }}
    >
      {/* Minimal header */}
      <header className="w-full px-6 py-5">
        <Logo size="sm" />
      </header>

      {/* Centered content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 -mt-16">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-foreground leading-[1.1] tracking-tight mb-5">
            Stay ahead of
            <br />
            the best internships
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed">
            A personalized calendar with early alerts — so you never miss an application window.
          </p>

          <Button
            ref={buttonRef}
            size="lg"
            onClick={handleCTAClick}
            disabled={animating}
            className="text-base px-10 py-6 rounded-full shadow-md hover:shadow-lg transition-all duration-300 text-lg"
          >
            Get Early Access
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <p className="mt-5 text-sm text-muted-foreground/70">
            Free • No credit card required
          </p>
        </div>
      </main>

      {/* Subtle decorative blobs */}
      <div className="fixed top-1/4 left-10 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-10 w-80 h-80 bg-status-expected/5 rounded-full blur-3xl pointer-events-none" />

      {/* Bubble animation overlay */}
      {animating && (
        <BubbleLogoAnimation
          onComplete={handleAnimationComplete}
          buttonRect={buttonRect}
        />
      )}
    </div>
  );
};

export default Index;
