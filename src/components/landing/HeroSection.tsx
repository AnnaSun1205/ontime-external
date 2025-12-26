import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ontimeIcon from "@/assets/ontime-icon.png";
export function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setPhoneVisible(true);
        setTimeout(() => setNotificationVisible(true), 600);
      }
    }, {
      threshold: 0.2
    });
    const current = sectionRef.current;
    if (current) {
      observer.observe(current);
    }
    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, []);
  return <section ref={sectionRef} className="relative min-h-[85vh] flex items-center bg-muted overflow-hidden py-16 md:py-24">
      {/* Bottom gradient fade to white */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-[1240px] mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-8 lg:gap-x-6 items-start lg:items-center">
          {/* Left: Messaging & CTA */}
          <div className={cn("transition-all duration-1000 ease-out max-w-xl lg:max-w-none", phoneVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8")}>
            <h1 className="text-foreground mb-3 leading-tight">
              <span className="block text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-bold tracking-tight">
                Best internships fill fast.
              </span>
              <span className="block text-3xl sm:text-4xl lg:text-[2.75rem] xl:text-5xl font-semibold tracking-tight mt-1">
                We help you stay ahead.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-foreground/80 font-medium mb-2 max-w-lg">A personalized internship calendar with early alerts.</p>
            <p className="text-base md:text-lg text-muted-foreground mb-5 max-w-lg">
              Get notified when applications open — or before, so you can prepare.
            </p>

            {/* Feature bullets */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full bg-status-opens-soon" />
                <span className="text-sm font-medium">Prep reminders</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full bg-status-live" />
                <span className="text-sm font-medium">Live alerts</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full bg-status-expected" />
                <span className="text-sm font-medium">Deadline updates</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="text-base px-8">
                <Link to="/signup">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base px-8">
                <a href="#product">See a sample calendar</a>
              </Button>
            </div>
          </div>

          {/* Right: Phone mockup */}
          <div className="flex justify-center mx-auto lg:mx-0 lg:justify-start max-w-[320px] lg:max-w-none">
            <div className={cn("relative transition-all duration-1000 ease-out", phoneVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12")}>
              {/* iPhone Frame */}
              <div className="relative w-[260px] md:w-[300px] h-[520px] md:h-[600px] bg-[#1a1a1a] rounded-[40px] md:rounded-[50px] p-2.5 shadow-2xl">
                {/* Dynamic Island */}
                <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20" />
                
                {/* Screen */}
                <div className="relative w-full h-full bg-gradient-to-b from-[#1a1a2e] to-[#16213e] rounded-[32px] md:rounded-[42px] overflow-hidden">
                  {/* Status bar */}
                  <div className="flex justify-between items-center px-7 pt-3.5 text-white/90 text-xs font-medium">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="flex gap-0.5">
                        <div className="w-1 h-2 bg-white/90 rounded-sm" />
                        <div className="w-1 h-2.5 bg-white/90 rounded-sm" />
                        <div className="w-1 h-3 bg-white/90 rounded-sm" />
                        <div className="w-1 h-3.5 bg-white/70 rounded-sm" />
                      </div>
                      <span className="ml-1 text-[10px]">5G</span>
                      <div className="ml-1.5 w-5 h-2.5 border border-white/90 rounded-sm relative">
                        <div className="absolute inset-0.5 bg-white/90 rounded-[1px]" style={{
                        width: '70%'
                      }} />
                        <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-1 bg-white/90 rounded-r-full" />
                      </div>
                    </div>
                  </div>

                  {/* Time display */}
                  <div className="text-center mt-12 md:mt-14">
                    <div className="text-white text-5xl md:text-6xl font-light tracking-tight">
                      9:41
                    </div>
                    <div className="text-white/60 text-xs mt-1">
                      Tuesday, January 14
                    </div>
                  </div>

                  {/* Stacked Notifications - bottom positioned like iOS */}
                  <div className="absolute bottom-12 left-2.5 right-2.5 flex flex-col gap-2">
                    {/* First notification - Google (opens soon) */}
                    <div className={cn("transition-all duration-700 ease-out delay-200", notificationVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
                      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-3 shadow-lg">
                        <div className="flex items-start gap-2.5">
                          <img src={ontimeIcon} alt="OnTime" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px] font-semibold text-gray-900 uppercase tracking-wide">
                                ONTIME
                              </span>
                              <span className="text-[9px] text-gray-500">2m ago</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                              <p className="text-[13px] font-semibold text-gray-900 leading-snug truncate">
                                Google — SWE Intern
                              </p>
                            </div>
                            <p className="text-[12px] text-gray-600 mt-0.5 leading-snug">
                              Opens tomorrow. Get ready.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Second notification - Meta (live now) */}
                    <div className={cn("transition-all duration-700 ease-out delay-500", notificationVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
                      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-3 shadow-lg">
                        <div className="flex items-start gap-2.5">
                          <img src={ontimeIcon} alt="OnTime" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px] font-semibold text-gray-900 uppercase tracking-wide">
                                ONTIME
                              </span>
                              <span className="text-[9px] text-gray-500">now</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                              <p className="text-[13px] font-semibold text-gray-900 leading-snug truncate">
                                Meta — SWE Intern
                              </p>
                            </div>
                            <p className="text-[12px] text-gray-600 mt-0.5 leading-snug">
                              Applications just opened.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Home indicator */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/50 rounded-full" />
                </div>
              </div>

              {/* Decorative glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-status-opens-soon/20 via-primary/10 to-status-live/20 blur-3xl -z-10 rounded-full opacity-50" />
            </div>
          </div>
        </div>
      </div>
    </section>;
}