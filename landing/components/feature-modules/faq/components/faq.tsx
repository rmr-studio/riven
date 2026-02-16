import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Section } from '@/components/ui/section';

const FAQ_ITEMS = [
  {
    question: 'What is Riven and how does it work?',
    answer:
      'Riven is a unified communication workspace that brings all your conversations into one place. It connects your email, messaging apps, and social channels so you never miss an important message.',
  },
  {
    question: 'Which platforms and integrations are supported?',
    answer:
      'We support Gmail, Slack, LinkedIn, Microsoft Teams, Outlook, WhatsApp, Instagram, and iMessage at launch, with more integrations on the way.',
  },
  {
    question: 'How much will Riven cost?',
    answer:
      'We are still finalising pricing. Join the waitlist to help us determine what feels fair, and you will be the first to know when we announce plans.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Absolutely. All data is encrypted in transit and at rest. We never sell your data and follow industry-standard security practices to keep your conversations private.',
  },
  {
    question: 'When will Riven be available?',
    answer:
      'We are currently in early development. Waitlist members will get priority access to our beta as soon as it is ready.',
  },
  {
    question: 'Can I join the early testing batch?',
    answer:
      'Yes! When you sign up through our waitlist, you will have the option to opt into our early testing programme and get hands-on access before anyone else.',
  },
];

export const Faq = () => {
  return (
    <Section id="faqs">
      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="mt-10">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-base">{item.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
};
