import { motion } from 'framer-motion';
import { BarChart3, Users, Wifi } from 'lucide-react';
import { AnimatedCounter } from '../common/AnimatedCounter';

interface StatPill {
  icon: typeof BarChart3;
  value: number;
  suffix: string;
  label: string;
}

const STATS: StatPill[] = [
  { icon: BarChart3, value: 50, suffix: 'K+', label: 'Analyses' },
  { icon: Users, value: 5, suffix: '', label: 'Legendary Investors' },
  { icon: Wifi, value: 100, suffix: '%', label: 'Real-Time' },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 },
  },
};

const pillVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export function StatsSection() {
  return (
    <motion.div
      className="flex items-center justify-center gap-3 sm:gap-5 mt-8 flex-wrap"
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-20px' }}
    >
      {STATS.map((stat) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            variants={pillVariants}
            className="glass flex items-center gap-2.5 rounded-2xl px-4 py-2.5 shadow-lg shadow-indigo-500/5 hover:shadow-xl hover:shadow-indigo-500/10 hover:scale-[1.03] transition-all duration-300"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0">
              <Icon size={14} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-stone-900 leading-tight">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={1500} />
              </span>
              <span className="text-[10px] text-stone-400 leading-tight">{stat.label}</span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
