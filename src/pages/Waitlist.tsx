import { useState } from "react";
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
  { name: "Goldman Sachs", domain: "goldmansachs.com" },
  { name: "JPMorgan", domain: "jpmorgan.com" },
  { name: "Morgan Stanley", domain: "morganstanley.com" },
  { name: "Citadel", domain: "citadel.com" },
  { name: "Jane Street", domain: "janestreet.com" },
  { name: "Databricks", domain: "databricks.com" },
  { name: "Snowflake", domain: "snowflake.com" },
  { name: "Palantir", domain: "palantir.com" },
  { name: "Coinbase", domain: "coinbase.com" },
  { name: "Figma", domain: "figma.com" },
  { name: "Notion", domain: "notion.so" },
  { name: "Slack", domain: "slack.com" },
  { name: "Dropbox", domain: "dropbox.com" },
  { name: "Pinterest", domain: "pinterest.com" },
  { name: "Snap", domain: "snap.com" },
  { name: "Twitter", domain: "twitter.com" },
  { name: "LinkedIn", domain: "linkedin.com" },
  { name: "Intel", domain: "intel.com" },
  { name: "AMD", domain: "amd.com" },
  { name: "NVIDIA", domain: "nvidia.com" },
  { name: "Oracle", domain: "oracle.com" },
  { name: "IBM", domain: "ibm.com" },
  { name: "SAP", domain: "sap.com" },
  { name: "Cisco", domain: "cisco.com" },
];

const ROW1 = COMPANIES.slice(0, 13);
const ROW2 = COMPANIES.slice(13, 26);
const ROW3 = COMPANIES.slice(26);

function MarqueeRow({ items, duration, reverse = false }: { items: typeof COMPANIES; duration: number; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="flex overflow-hidden select-none pointer-events-none">
      <div
        className={`flex shrink-0 gap-4 ${reverse ? "animate-[marquee-reverse_var(--duration)_linear_infinite]" : "animate-[marquee_var(--duration)_linear_infinite]"}`}
        style={{ "--duration": `${duration}s` } as React.CSSProperties}
      >
        {doubled.map((company, i) => (
          <span
            key={`${company.name}-${i}`}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-border/60 bg-background/80 text-sm font-medium text-muted-foreground whitespace-nowrap backdrop-blur-sm"
          >
            <img
              src={`https://logo.clearbit.com/${company.domain}`}
              alt=""
              className="w-5 h-5 rounded-full object-contain"
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            {company.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

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
      {/* Scrolling company marquee background */}
      <div className="absolute inset-0 flex flex-col justify-center gap-4 opacity-[0.35]" aria-hidden="true">
        <MarqueeRow items={ROW1} duration={35} />
        <MarqueeRow items={ROW2} duration={40} reverse />
        <MarqueeRow items={ROW3} duration={30} />
      </div>

      {/* Radial fade so center content pops */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, hsl(var(--background)) 30%, transparent 80%)",
        }}
        aria-hidden="true"
      />

      <header className="container py-6 relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-md text-center space-y-8 bg-card rounded-2xl p-8 shadow-lg border border-border/40">
          <Logo size="md" />

          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-serif font-semibold tracking-tight">
              Join the waitlist
            </h1>
            <p className="text-muted-foreground text-base">
              We're expanding to new regions soon. Drop your email and we'll let you know when we launch near you.
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
