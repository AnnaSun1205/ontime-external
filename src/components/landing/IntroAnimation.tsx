import { useState, useEffect } from "react";
import logoImage from "@/assets/ontime-logo.png";

interface IntroAnimationProps {
  onComplete: () => void;
}

export function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(2), 1000),  // Show mission text
      setTimeout(() => setPhase(3), 2500),  // Start fade out
      setTimeout(() => onComplete(), 3000), // Complete
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div 
      className={`
        fixed inset-0 z-50 bg-white flex items-center justify-center
        transition-opacity duration-500 ease-out
        ${phase >= 3 ? "opacity-0" : "opacity-100"}
      `}
    >
      <div className="flex flex-col items-center justify-center px-6">
        {/* Logo */}
        <img
          src={logoImage}
          alt="OnTime"
          className={`
            h-16 md:h-20 w-auto
            transition-all duration-700 ease-out
            ${phase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        />
        
        {/* Mission statement */}
        <p
          className={`
            text-lg md:text-xl text-muted-foreground mt-6 text-center
            transition-all duration-700 ease-out
            ${phase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >
          We speak only when it matters.
        </p>
      </div>
    </div>
  );
}