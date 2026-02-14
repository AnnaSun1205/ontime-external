import { useState, useEffect, useCallback } from "react";
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
  { name: "Coinbase", domain: "coinbase.com" },
  { name: "Notion", domain: "notion.so" },
  { name: "Slack", domain: "slack.com" },
  { name: "Dropbox", domain: "dropbox.com" },
];

interface BubbleLogo {
  id: number;
  domain: string;
  startX: number;
  startY: number;
  delay: number;
  drift: number;
  duration: number;
  size: number;
}

function generateBubbleWave(startId: number, count: number): BubbleLogo[] {
  const shuffled = [...COMPANIES].sort(() => Math.random() - 0.5).slice(0, count);
  return shuffled.map((company, i) => ({
    id: startId + i,
    domain: company.domain,
    startX: 10 + Math.random() * 80, // % from left
    startY: 60 + Math.random() * 30, // % from top (start in lower area)
    delay: i * 0.15 + Math.random() * 0.1,
    drift: (Math.random() - 0.5) * 60,
    duration: 2.5 + Math.random() * 1.5,
    size: 32 + Math.random() * 16,
  }));
}

function BackgroundBubbles({ bubbles }: { bubbles: BubbleLogo[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]" aria-hidden="true">
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="absolute"
          style={{
            left: `${b.startX}%`,
            top: `${b.startY}%`,
            animationName: "bubble-rise",
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            animationTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            animationFillMode: "forwards",
            opacity: 0,
          }}
        >
          <div
            className="rounded-full bg-card/80 shadow-sm border border-border/30 flex items-center justify-center backdrop-blur-sm"
            style={{
              width: b.size,
              height: b.size,
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
              className="rounded-full object-contain"
              style={{ width: b.size * 0.6, height: b.size * 0.6 }}
              loading="eager"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
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

  // Spawn bubbles on page load in waves
  useEffect(() => {
    let id = 0;
    const wave1 = generateBubbleWave(id, 10);
    id += 10;
    setBubbles(wave1);

    const t2 = setTimeout(() => {
      const wave2 = generateBubbleWave(id, 8);
      id += 8;
      setBubbles((prev) => [...prev, ...wave2]);
    }, 1800);

    const t3 = setTimeout(() => {
      const wave3 = generateBubbleWave(id, 6);
      setBubbles((prev) => [...prev, ...wave3]);
    }, 3500);

    // Clean up old bubbles after they've animated
    const cleanup = setTimeout(() => {
      setBubbles([]);
    }, 6000);

    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(cleanup);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setLoading(true);
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
        setJoined(true);
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

      {/* Background bubble logos on page load */}
      <BackgroundBubbles bubbles={bubbles} />

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
        <div className="w-full max-w-md text-center space-y-8 bg-card rounded-2xl p-8 shadow-lg border border-border/40 relative">
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
              <Button type="submit" disabled={loading} className="shrink-0">
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
