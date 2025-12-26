import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Is this auto-apply?",
    answer:
      "No. OnTime never applies to jobs on your behalf. We simply notify you when it's time to act, and link you directly to official company postings.",
  },
  {
    question: "Do you scrape LinkedIn?",
    answer:
      "No. We only link to official company career pages and applicant tracking systems (ATS). We don't scrape third-party job boards.",
  },
  {
    question: "How many emails will I get?",
    answer:
      "Only when it matters. Quiet mode is the default — you'll receive prep signals before expected windows and live signals when postings actually go up. That's it.",
  },
  {
    question: "How accurate are the predicted windows?",
    answer:
      "Our predictions are based on historical data from previous recruiting seasons. We mark each prediction with a confidence level (High, Medium, Low) so you know what to expect.",
  },
  {
    question: "Can I pause tracking for specific companies?",
    answer:
      "Yes. You can pause any company at any time. You'll stop receiving alerts for that company, but it will remain in your list for when you're ready to resume.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-24 bg-muted relative">
      {/* Top gradient fade from white */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-transparent pointer-events-none" />
      
      <div className="container relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently asked questions</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Got questions? We've got answers.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Accordion key={index} type="single" collapsible className="w-full">
              <AccordionItem 
                value={`item-${index}`} 
                className="bg-white rounded-xl border border-border shadow-sm px-6 data-[state=open]:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5 text-base font-medium [&>svg]:hidden">
                  <span className="flex-1">{faq.question}</span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 text-sm leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ))}
        </div>
      </div>
    </section>
  );
}