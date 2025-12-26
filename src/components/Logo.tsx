import { cn } from "@/lib/utils";
import logoImage from "@/assets/ontime-logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizes = {
    sm: "h-10",
    md: "h-12",
    lg: "h-16",
  };

  return (
    <div className={cn("flex items-center", className)}>
      <img 
        src={logoImage} 
        alt="OnTime" 
        className={cn(sizes[size], "w-auto")} 
      />
    </div>
  );
}