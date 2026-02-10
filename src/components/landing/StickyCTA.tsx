import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.8);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`
        fixed bottom-0 inset-x-0 z-40 md:hidden
        transition-all duration-300 ease-out
        ${visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
      `}
    >
      <div className="bg-background/95 backdrop-blur-md border-t border-border px-4 py-3 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
        {/* Country tracking strip */}
        <div className="flex items-center justify-center gap-2 mb-2.5">
          <span className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
            🇨🇦 Canada
            <span className="w-1.5 h-1.5 rounded-full bg-status-live animate-pulse" />
          </span>
          <span className="text-[10px] text-muted-foreground">·</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            🇺🇸 US
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted font-medium">Soon</span>
          </span>
          <span className="text-[10px] text-muted-foreground">·</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            🇬🇧 UK
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted font-medium">Soon</span>
          </span>
          <span className="text-[10px] text-muted-foreground">·</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            🇦🇺 AU
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted font-medium">Soon</span>
          </span>
        </div>

        <Button asChild size="lg" className="w-full rounded-full text-base">
          <Link to="/signup">
            Get Started Free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
