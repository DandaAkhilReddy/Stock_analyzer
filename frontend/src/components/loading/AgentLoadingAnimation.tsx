import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Search,
  BarChart2,
  FileText,
  Shield,
  Activity,
  Target,
  Zap,
} from 'lucide-react';

interface AgentLoadingAnimationProps {
  ticker: string;
  message: string;
  elapsedSeconds: number;
}

const outerAgents = [
  { icon: Search, label: 'Scanning', offset: 0 },
  { icon: BarChart2, label: 'Charting', offset: 90 },
  { icon: FileText, label: 'Filings', offset: 180 },
  { icon: Shield, label: 'Risk', offset: 270 },
];

const innerAgents = [
  { icon: Activity, label: 'Technical', offset: 0 },
  { icon: Target, label: 'Predictions', offset: 120 },
  { icon: Zap, label: 'Signals', offset: 240 },
];

function OrbitingIcon({
  icon: Icon,
  radius,
  offset,
  duration,
  reverse,
}: {
  icon: React.ElementType;
  radius: number;
  offset: number;
  duration: number;
  reverse?: boolean;
}) {
  return (
    <motion.div
      className="absolute"
      style={{
        top: '50%',
        left: '50%',
        marginTop: -14,
        marginLeft: -14,
      }}
      animate={{ rotate: reverse ? [offset, offset - 360] : [offset, offset + 360] }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    >
      <motion.div
        style={{ transform: `translateX(${radius}px)` }}
      >
        <motion.div
          animate={{ rotate: reverse ? [0, 360] : [0, -360] }}
          transition={{ duration, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-7 h-7 rounded-full bg-white shadow-md border border-stone-200 flex items-center justify-center">
            <Icon size={13} className="text-indigo-500" />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function DataParticle({ delay, duration }: { delay: number; duration: number }) {
  const angle = delay * 137.5;
  const rad = (angle * Math.PI) / 180;
  const startX = Math.cos(rad) * 130;
  const startY = Math.sin(rad) * 130;

  return (
    <motion.div
      className="absolute w-1.5 h-1.5 rounded-full bg-indigo-400/60"
      style={{ top: '50%', left: '50%', marginTop: -3, marginLeft: -3 }}
      animate={{
        x: [startX, startX * 0.3, 0],
        y: [startY, startY * 0.3, 0],
        opacity: [0, 0.8, 0],
        scale: [0.5, 1, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: 'easeIn',
      }}
    />
  );
}

export function AgentLoadingAnimation({ ticker, message, elapsedSeconds }: AgentLoadingAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-72px)] gap-8 relative overflow-hidden">
      {/* Background glow blobs */}
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-indigo-400/10 blur-3xl"
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.2, 0.9, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        style={{ top: '30%', left: '40%' }}
      />
      <motion.div
        className="absolute w-52 h-52 rounded-full bg-violet-400/10 blur-3xl"
        animate={{ x: [0, -30, 40, 0], y: [0, 40, -20, 0], scale: [1, 0.9, 1.15, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        style={{ top: '40%', left: '50%' }}
      />

      {/* Orbital system */}
      <div className="relative w-72 h-72">
        {/* Outer orbit ring */}
        <motion.div
          className="absolute inset-0 m-auto w-60 h-60 rounded-full border border-indigo-200/30"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Inner orbit ring */}
        <motion.div
          className="absolute inset-0 m-auto w-40 h-40 rounded-full border border-violet-200/30"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        {/* Center hub — Brain icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25"
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Brain size={28} className="text-white" />
          </motion.div>
        </div>

        {/* Outer orbiting agents */}
        {outerAgents.map((agent) => (
          <OrbitingIcon
            key={agent.label}
            icon={agent.icon}
            radius={120}
            offset={agent.offset}
            duration={8}
          />
        ))}

        {/* Inner orbiting agents */}
        {innerAgents.map((agent) => (
          <OrbitingIcon
            key={agent.label}
            icon={agent.icon}
            radius={80}
            offset={agent.offset}
            duration={6}
            reverse
          />
        ))}

        {/* Data particles flowing inward */}
        {Array.from({ length: 8 }).map((_, i) => (
          <DataParticle key={i} delay={i * 0.4} duration={2.5} />
        ))}
      </div>

      {/* Text area */}
      <div className="text-center space-y-2 relative z-10">
        <p className="text-stone-900 font-semibold text-lg">
          Analyzing {ticker}...
        </p>

        <div className="h-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={message}
              className="text-stone-500 text-sm"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              {message}
            </motion.p>
          </AnimatePresence>
        </div>

        <p className="text-stone-300 text-xs tabular-nums">{elapsedSeconds}s</p>
      </div>
    </div>
  );
}
