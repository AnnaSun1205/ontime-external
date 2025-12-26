export function HowItWorksSection() {
  const steps = [
    {
      step: "1",
      title: "Pick your companies",
      description: "Select up to 15 companies you want to track for internship applications.",
    },
    {
      step: "2",
      title: "Get your calendar",
      description: "We generate a personalized timeline with all your application windows.",
    },
    {
      step: "3",
      title: "Stay notified",
      description: "Receive prep reminders 7 days before and live alerts when apps open.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get set up in under 2 minutes. No complex configuration required.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((item, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full text-xl font-bold mb-4">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
