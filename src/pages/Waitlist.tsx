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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="container py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-8">
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
            <div className="flex flex-col items-center gap-3 py-6">
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
                className="flex-1"
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
