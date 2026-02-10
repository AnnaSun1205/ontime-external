import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function FinalCTA() {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session?.user);
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <section 
      ref={ref}
      className={`
        py-24 relative transition-all duration-1000 ease-out overflow-hidden
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
      `}
    >
      {/* Gradient background layer - positioned absolutely to avoid container seams */}
      {/* Fully blue throughout, smooth transition to white at bottom for footer */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: 'linear-gradient(to bottom, hsl(214 95% 93%) 0%, hsl(214 95% 93%) 70%, hsl(214 95% 96%) 85%, #ffffff 100%)'
        }}
      />
      
      <div className="container relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif mb-4">
            Apply on time. Every time.
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button 
              size="lg" 
              asChild 
              className="text-base px-8"
            >
              <Link to="/signup">Get started</Link>
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="text-base px-8"
            >
              <Link to={isLoggedIn ? "/app" : "/login"}>
                View dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

