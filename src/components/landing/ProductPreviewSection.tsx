export function ProductPreviewSection() {
  return (
    <section id="product" className="py-20 bg-card">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Your Personal Recruiting Calendar</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See all your tracked companies at a glance. Color-coded signals help you prioritize what needs attention.
          </p>
        </div>
        <div className="max-w-4xl mx-auto bg-background rounded-2xl border border-border p-8 shadow-lg">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => {
              const hasLive = i === 12 || i === 23;
              const hasPrep = i === 8 || i === 19;
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-lg border flex items-center justify-center text-sm ${
                    hasLive
                      ? "bg-status-live-bg border-status-live text-status-live font-medium"
                      : hasPrep
                      ? "bg-status-prepare-bg border-status-prepare text-status-prepare font-medium"
                      : "border-border"
                  }`}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
          <div className="flex gap-6 justify-center mt-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-status-live" />
              <span>Applications Open</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-status-prepare" />
              <span>Prep Week</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
