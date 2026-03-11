import { motion } from 'framer-motion';
import type { NewsItem } from '../../types/analysis';

interface NewsCardProps {
  item: NewsItem;
  index?: number;
}

const sentimentColor: Record<string, string> = {
  positive: 'text-emerald-600',
  negative: 'text-red-600',
  neutral: 'text-stone-400',
};

export function NewsCard({ item, index = 0 }: NewsCardProps) {
  const sentimentClass =
    item.sentiment !== null ? (sentimentColor[item.sentiment] ?? 'text-stone-400') : 'text-stone-400';

  return (
    <motion.div
      className="block p-3 rounded-lg hover:bg-stone-100 transition-colors"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <h5 className="text-sm text-stone-700 hover:text-stone-900 leading-snug">
        {item.title}
      </h5>
      <div className="flex items-center gap-3 mt-1.5 text-xs text-stone-400">
        {item.source !== null && (
          <span className="font-medium">{item.source}</span>
        )}
        {item.sentiment !== null && (
          <span className={`capitalize font-medium ${sentimentClass}`}>
            {item.sentiment}
          </span>
        )}
      </div>
    </motion.div>
  );
}
