import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TICKER_EXAMPLES: string[] = [
  'Analyze AAPL...',
  'Analyze TSLA...',
  'Analyze GOOGL...',
  'Analyze MSFT...',
  'Analyze NVDA...',
];

const TYPING_SPEED_MS = 60;
const HOLD_MS = 1800;
const ERASE_SPEED_MS = 35;

const TITLE_LETTERS = 'Reddy'.split('');

const EASE_SMOOTH = [0.16, 1, 0.3, 1] as const;

const letterVariants = {
  hidden: { opacity: 0, y: 30, rotateX: -40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.5,
      ease: EASE_SMOOTH,
    },
  }),
};

const SUBTITLE_WORDS = 'Real-time data, AI insights, and legendary investor analysis'.split(' ');

export function HeroTitle() {
  const [phraseIndex, setPhraseIndex] = useState<number>(0);
  const [displayed, setDisplayed] = useState<string>('');
  const [isErasing, setIsErasing] = useState<boolean>(false);

  useEffect(() => {
    const target = TICKER_EXAMPLES[phraseIndex] ?? '';

    if (!isErasing && displayed.length < target.length) {
      const id = setTimeout(
        () => setDisplayed(target.slice(0, displayed.length + 1)),
        TYPING_SPEED_MS,
      );
      return () => clearTimeout(id);
    }

    if (!isErasing && displayed.length === target.length) {
      const id = setTimeout(() => setIsErasing(true), HOLD_MS);
      return () => clearTimeout(id);
    }

    if (isErasing && displayed.length > 0) {
      const id = setTimeout(
        () => setDisplayed(displayed.slice(0, -1)),
        ERASE_SPEED_MS,
      );
      return () => clearTimeout(id);
    }

    if (isErasing && displayed.length === 0) {
      setIsErasing(false);
      setPhraseIndex((i) => (i + 1) % TICKER_EXAMPLES.length);
    }
  }, [displayed, isErasing, phraseIndex]);

  return (
    <div className="text-center">
      {/* Main title — character-by-character stagger with 3D perspective */}
      <motion.h1
        className="text-5xl sm:text-6xl lg:text-7xl font-bold text-stone-900 tracking-tight flex items-center justify-center"
        initial="hidden"
        animate="visible"
        style={{ perspective: '600px' }}
      >
        {TITLE_LETTERS.map((letter, i) => (
          <motion.span
            key={i}
            custom={i}
            variants={letterVariants}
            className="inline-block"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {letter}
          </motion.span>
        ))}
      </motion.h1>

      {/* Subtitle with gradient — scale bounce entry */}
      <motion.h2
        className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-stone-800 tracking-tight mt-2"
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        AI Powered{' '}
        <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
          Stock Analyzer
        </span>
      </motion.h2>

      {/* Description — word-by-word blur-in reveal */}
      <motion.p
        className="mt-4 text-lg sm:text-xl text-stone-500 max-w-lg mx-auto flex flex-wrap items-center justify-center gap-x-1.5"
        initial="hidden"
        animate="visible"
      >
        {SUBTITLE_WORDS.map((word, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{
              delay: 0.5 + i * 0.04,
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
        ))}
      </motion.p>

      {/* Typing animation — enhanced cursor with glow */}
      <motion.div
        className="mt-5 h-7 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.8 }}
        aria-live="polite"
        aria-label="Ticker example animation"
      >
        <AnimatePresence mode="wait">
          <span className="font-mono text-sm text-indigo-400/80 tracking-wide select-none">
            {displayed}
            <span
              className="inline-block w-0.5 h-4 ml-0.5 bg-indigo-400 align-middle animate-pulse rounded-full"
              style={{ boxShadow: '0 0 8px 2px rgba(99, 102, 241, 0.4)' }}
            />
          </span>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
