import { motion } from 'framer-motion';
import {
  CandlestickChart,
  TrendingUp,
  BarChart2,
  DollarSign,
  Percent,
  Activity,
  LineChart,
  PieChart,
} from 'lucide-react';

interface FloatingItem {
  icon: React.ElementType;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

const items: FloatingItem[] = [
  { icon: CandlestickChart, x: 8, y: 15, size: 32, delay: 0, duration: 6 },
  { icon: TrendingUp, x: 85, y: 20, size: 28, delay: 0.5, duration: 7 },
  { icon: BarChart2, x: 15, y: 70, size: 36, delay: 1, duration: 5.5 },
  { icon: DollarSign, x: 75, y: 65, size: 24, delay: 1.5, duration: 6.5 },
  { icon: Percent, x: 50, y: 10, size: 20, delay: 2, duration: 5 },
  { icon: Activity, x: 90, y: 50, size: 30, delay: 0.8, duration: 7.5 },
  { icon: LineChart, x: 5, y: 45, size: 26, delay: 1.2, duration: 6 },
  { icon: PieChart, x: 65, y: 85, size: 22, delay: 1.8, duration: 5.5 },
];

export function FloatingElements(): React.ReactElement {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ perspective: '1200px' }}
    >
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={index}
            className="absolute text-stone-300/40"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transformStyle: 'preserve-3d',
            }}
            animate={{
              y: [0, -(15 + index * 2), 0],
              rotateX: [0, 15, 0],
              rotateY: [0, -10, 0],
              scale: [1, 1.15, 1],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: item.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: item.delay,
            }}
          >
            <Icon size={item.size} />
          </motion.div>
        );
      })}
    </div>
  );
}
