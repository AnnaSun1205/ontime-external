import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().trim().email("Please enter a valid email").max(255, "Email is too long");

const COMPANIES: { name: string; domain: string }[] = [
  { name: "Google", domain: "google.com" },
  { name: "Meta", domain: "meta.com" },
  { name: "Amazon", domain: "amazon.com" },
  { name: "Apple", domain: "apple.com" },
  { name: "Microsoft", domain: "microsoft.com" },
  { name: "Tesla", domain: "tesla.com" },
  { name: "Netflix", domain: "netflix.com" },
  { name: "Shopify", domain: "shopify.com" },
  { name: "Stripe", domain: "stripe.com" },
  { name: "Airbnb", domain: "airbnb.com" },
  { name: "Uber", domain: "uber.com" },
  { name: "Spotify", domain: "spotify.com" },
  { name: "Adobe", domain: "adobe.com" },
  { name: "Salesforce", domain: "salesforce.com" },
  { name: "NVIDIA", domain: "nvidia.com" },
  { name: "Figma", domain: "figma.com" },
];

interface BubbleLogo {
  id: number;
  domain: string;
  x: number;
  delay: number;
  drift: number;
  duration: number;
}

function LogoBubbles({ bubbles }: { bubbles: BubbleLogo[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="absolute bottom-[40%] rounded-full"
          style={{
            left: `calc(50% + ${b.x}px)`,
            animationName: "bubble-rise",
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            animationTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            animationFillMode: "forwards",
            opacity: 0,
          }}
        >
          <div
            className="w-10 h-10 rounded-full bg-card shadow-md border border-border/40 flex items-center justify-center"
            style={{
              animationName: "bubble-drift",
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
              animationTimingFunction: "ease-in-out",
              animationFillMode: "forwards",
              ["--drift" as string]: `${b.drift}px`,
            }}
          >
            <img
              src={`https://logo.clearbit.com/${b.domain}`}
              alt=""
              className="w-6 h-6 rounded-full object-contain"
              loading="eager"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [bubbles, setBubbles] = useState<BubbleLogo[]>([]);
  const bubbleIdRef = useRef(0);

  const spawnBubbles = useCallback(() => {
    const count = 12;
    const shuffled = [...COMPANIES].sort(() => Math.random() - 0.5).slice(0, count);
    const newBubbles: BubbleLogo[] = shuffled.map((company, i) => ({
      id: bubbleIdRef.current++,
      domain: company.domain,
      x: (Math.random() - 0.5) * 200,
      delay: i * 0.07,
      drift: (Math.random() - 0.5) * 80,
      duration: 1.1 + Math.random() * 0.4,
    }));
    setBubbles(newBubbles);
    setTimeout(() => setBubbles([]), 2000);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    spawnBubbles();

    try {
      const { error } = await supabase.from("waitlist").insert({ email: result.data });

      if (error) {
        if (error.code === "23505") {
          toast.info("You're already on the waitlist!");
          setJoined(true);
        } else {
          toast.error("Something went wrong. Please try again.");
        }
      } else {
        setTimeout(() => setJoined(true), 800);
        toast.success("You're on the list!");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Soft gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, hsl(var(--secondary) / 0.6) 0%, hsl(var(--background)) 70%)",
        }}
        aria-hidden="true"
      />

      <header className="container py-6 relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 relative z-10">
        {/* Bubble animation layer */}
        <LogoBubbles bubbles={bubbles} />

        <div className="w-full max-w-md text-center space-y-8 bg-card rounded-2xl p-8 shadow-lg border border-border/40 relative z-10">
          <Logo size="md" />

          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-serif font-semibold tracking-tight">
              Join the waitlist
            </h1>
            <p className="text-muted-foreground text-base">
              We're expanding to new regions soon. Drop your email and we'll let you know when we
              launch near you.
            </p>
          </div>

          {joined ? (
            <div className="flex flex-col items-center gap-3 py-6 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-[hsl(142,60%,95%)] flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-[hsl(142,71%,35%)]" />
              </div>
              <p className="text-lg font-medium">You're on the list!</p>
              <p className="text-sm text-muted-foreground">We'll reach out when it's your turn.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 h-12 bg-white border-border shadow-sm text-base"
                disabled={loading}
              />
              <Button type="submit" disabled={loading} className="shrink-0 relative overflow-visible">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join waitlist"}
              </Button>
            </form>
          )}

          <p className="text-xs text-muted-foreground">
            No spam, ever. We'll only email you about launch updates.
          </p>
        </div>
      </main>
    </div>
  );
}
