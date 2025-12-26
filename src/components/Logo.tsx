import logoImage from "@/assets/ontime-logo.png";

interface LogoProps {
  className?: string;
}

export const Logo = ({ className }: LogoProps) => {
  return (
    <img
      src={logoImage}
      alt="OnTime Logo"
      className={`h-8 w-auto ${className || ""}`}
    />
  );
};
