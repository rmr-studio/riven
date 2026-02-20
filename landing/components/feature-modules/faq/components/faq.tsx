import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Section } from '@/components/ui/section';
import { ReactNode } from 'react';

interface Question {
  question: string;
  answer: ReactNode;
}

const FAQ: Question[] = [
  {
    question: 'How is this different from Notion / Airtable / HubSpot / Salesforce?',
    answer:
      'Riven is a unified communication workspace that brings all your conversations into one place. It connects your email, messaging apps, and social channels so you never miss an important message.',
  },
  {
    question: 'Does Riven replace my existing tools?',
    answer:
      'We support Gmail, Slack, LinkedIn, Microsoft Teams, Outlook, WhatsApp, Instagram, and iMessage at launch, with more integrations on the way.',
  },
  {
    question: 'What integrations do you support?',
    answer:
      'We are still finalising pricing. Join the waitlist to help us determine what feels fair, and you will be the first to know when we announce plans.',
  },
  {
    question: 'How does the AI knowledge layer actually work?',
    answer:
      'Absolutely. All data is encrypted in transit and at rest. We never sell your data and follow industry-standard security practices to keep your conversations private.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'We are currently in early development. Waitlist members will get priority access to our beta as soon as it is ready.',
  },
  {
    question: 'What happens when I join the waitlist?',
    answer:
      'Yes! When you sign up through our waitlist, you will have the option to opt into our early testing programme and get hands-on access before anyone else.',
  },
  {
    question: 'Can I join the early testing batch?',
    answer:
      'Yes! When you sign up through our waitlist, you will have the option to opt into our early testing programme and get hands-on access before anyone else.',
  },
  {
    question: 'Who is this built for?',
    answer:
      'Yes! When you sign up through our waitlist, you will have the option to opt into our early testing programme and get hands-on access before anyone else.',
  },
];

export const Faq = () => {
  return (
    <Section id="faqs">
      <div className="items-cen relative z-10 mx-auto flex max-w-5xl flex-col px-4 sm:px-6">
        <h2 className="text-center text-4xl font-semibold tracking-tight md:text-5xl">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="mt-10">
          {FAQ.map((item, i) => (
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
