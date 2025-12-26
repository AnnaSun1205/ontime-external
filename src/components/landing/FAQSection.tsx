import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQSection() {
  const faqs = [
    {
      question: "How does OnTime know when applications open?",
      answer: "We aggregate data from company career pages, student forums, and historical trends to predict and track application windows accurately.",
    },
    {
      question: "Is OnTime really free?",
      answer: "Yes! Our core features are completely free. We may add premium features in the future, but the essentials will always be free for students.",
    },
    {
      question: "Which companies do you track?",
      answer: "We track 100+ top tech companies, finance firms, and consulting agencies. You can select up to 15 to focus on.",
    },
    {
      question: "How do reminders work?",
      answer: "You'll receive an email 7 days before applications open (prep reminder) and another when they go live. You can customize notification preferences.",
    },
  ];

  return (
    <section id="faq" className="py-20 bg-card">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
        </div>
        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
