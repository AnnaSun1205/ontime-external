import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock, Bell } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 animate-fade-in">
            Never miss an internship deadline again
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            OnTime tracks application windows for top tech companies and sends you timely reminders so you can apply with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Button asChild size="lg" className="gap-2">
              <Link to="/signup">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <div className="p-3 bg-secondary rounded-lg">
              <Calendar className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <p className="font-medium">Smart Calendar</p>
              <p className="text-sm text-muted-foreground">Track all deadlines</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <div className="p-3 bg-secondary rounded-lg">
              <Bell className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <p className="font-medium">Timely Reminders</p>
              <p className="text-sm text-muted-foreground">7-day prep alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            <div className="p-3 bg-secondary rounded-lg">
              <Clock className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <p className="font-medium">Real-time Updates</p>
              <p className="text-sm text-muted-foreground">Never miss a window</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
