import { CheckCircle, Target, Zap } from "lucide-react";

export function SellingPointsSection() {
  const points = [
    {
      icon: Target,
      title: "Focus on what matters",
      description: "Track only the companies you care about. No noise, just signal.",
    },
    {
      icon: Zap,
      title: "Stay ahead of the curve",
      description: "Get notified before applications open so you can prepare your materials.",
    },
    {
      icon: CheckCircle,
      title: "Apply with confidence",
      description: "Never scramble at the last minute. Submit polished applications on time.",
    },
  ];

  return (
    <section className="py-20 bg-card">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why OnTime?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            The internship search is stressful enough. Let us handle the logistics so you can focus on landing your dream role.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {points.map((point, index) => (
            <div key={index} className="text-center p-6">
              <div className="inline-flex p-4 bg-secondary rounded-full mb-4">
                <point.icon className="w-8 h-8 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{point.title}</h3>
              <p className="text-muted-foreground">{point.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
