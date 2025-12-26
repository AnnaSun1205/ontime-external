import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { IntroAnimation } from "@/components/landing/IntroAnimation";
import { HeroSection } from "@/components/landing/HeroSection";
import { SellingPointsSection } from "@/components/landing/SellingPointsSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ProductPreviewSection } from "@/components/landing/ProductPreviewSection";
import { CompaniesSection } from "@/components/landing/CompaniesSection";
import { CompanyLogosSection } from "@/components/landing/CompanyLogosSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";

const Index = () => {
  const [showIntro, setShowIntro] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

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
          <ProductPreviewSection />
          <CompaniesSection />
          <CompanyLogosSection />
          <PricingSection />
          <FAQSection />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Index;
