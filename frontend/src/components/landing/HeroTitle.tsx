import { motion } from 'framer-motion';

export function HeroTitle(): JSX.Element {
  return (
    <div className="text-center">
      <motion.h1
        className="text-5xl sm:text-6xl lg:text-7xl font-bold text-stone-900 tracking-tight"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        AI-Powered{' '}
        <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
          Stock Analysis
        </span>
      </motion.h1>
      <motion.p
        className="mt-4 text-lg sm:text-xl text-stone-500 max-w-lg mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        Technical indicators, price predictions, and real-time news — powered by AI
      </motion.p>
    </div>
  );
}
