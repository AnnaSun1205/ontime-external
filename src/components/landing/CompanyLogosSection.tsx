export function CompanyLogosSection() {
  const companies = [
    "Google", "Meta", "Amazon", "Apple", "Microsoft", "Netflix",
    "Stripe", "Airbnb", "Uber", "Lyft", "Snap", "Salesforce"
  ];

  return (
    <section className="py-12 bg-card overflow-hidden">
      <div className="container">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Trusted by students applying to
        </p>
        <div className="relative">
          <div className="flex gap-12 animate-scroll-left">
            {[...companies, ...companies].map((company, i) => (
              <div
                key={i}
                className="flex-shrink-0 text-lg font-medium text-muted-foreground/60"
              >
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
