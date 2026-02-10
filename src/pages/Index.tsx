import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { IntroAnimation } from "@/components/landing/IntroAnimation";
import { HeroSection } from "@/components/landing/HeroSection";
import { SellingPointsSection } from "@/components/landing/SellingPointsSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeatureShowcaseSection } from "@/components/landing/FeatureShowcaseSection";
import { ProductPreviewSection } from "@/components/landing/ProductPreviewSection";
import { NetworkingSection } from "@/components/landing/NetworkingSection";
import { CompaniesSection } from "@/components/landing/CompaniesSection";
import { CompanyLogosSection } from "@/components/landing/CompanyLogosSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { ReviewsSection } from "@/components/landing/ReviewsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCTA } from "@/components/landing/FinalCTA";

const Index = () => {
  const navigate = useNavigate();
  const [showIntro, setShowIntro] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

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
      // If Supabase redirects OAuth back to "/" (misconfigured redirect URLs),
      // we still want to complete the session exchange and route straight into the app.
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled && session?.user) {
        await redirectAuthedUser(session.user.id);
      }
    };

    // Run once on load
    checkAndRedirect();

    // Also react immediately if auth state changes (e.g. OAuth completes after load)
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

  useEffect(() => {
    // Check if user has seen the intro before
    const hasSeenIntro = sessionStorage.getItem("ontime-intro-seen");
    if (!hasSeenIntro) {
      setShowIntro(true);
    } else {
      setIntroComplete(true);
    }
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem("ontime-intro-seen", "true");
    setShowIntro(false);
    setIntroComplete(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}

      <div className={`transition-opacity duration-700 ${introComplete ? "opacity-100" : "opacity-0"}`}>
        <Header />
        <main className="flex-1">
          <HeroSection />
          <SellingPointsSection />
          <HowItWorksSection />
          <FeatureShowcaseSection />
          <ProductPreviewSection />
          <NetworkingSection />
          <CompaniesSection />
          <CompanyLogosSection />
          <ReviewsSection />
          <PricingSection />
          <FAQSection />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Index;
