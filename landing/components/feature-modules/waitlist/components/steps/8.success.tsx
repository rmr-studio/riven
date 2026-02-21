import { CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export function SuccessStep() {
  return (
    <div className="py-16 text-center md:py-24">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.1,
        }}
      >
        <CheckCircle2 className="mx-auto h-14 w-14 text-teal-500" />
      </motion.div>
      <h3 className="mt-6 text-2xl font-semibold md:text-3xl">You are on the list!</h3>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        Thanks for joining the waitlist. We cannot wait to share all updates, news and exciting
        features with you. The team looks forward to working with you as we build the future of
        cross-domain intelligence.
      </p>
    </div>
  );
}
