export function CompaniesSection() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Track Top Companies</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We monitor application windows for 100+ top tech companies, finance firms, and consulting agencies.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
          {[
            "Google", "Meta", "Amazon", "Apple", "Microsoft", "Netflix",
            "Stripe", "Airbnb", "Goldman Sachs", "McKinsey", "Figma", "Notion"
          ].map((company) => (
            <div
              key={company}
              className="p-4 bg-card rounded-xl border border-border text-center font-medium text-sm"
            >
              {company}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
