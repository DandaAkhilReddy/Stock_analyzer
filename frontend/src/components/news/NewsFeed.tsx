import { Newspaper } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../common/Card';
import { NewsCard } from './NewsCard';
import type { NewsItem } from '../../types/analysis';

interface NewsFeedProps {
  items: NewsItem[];
}

export function NewsFeed({ items }: NewsFeedProps) {
  return (
    <Card>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Newspaper size={16} className="text-indigo-500" />
        <h4 className="text-sm font-semibold text-stone-700">Latest News</h4>
        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs
                         bg-stone-100 text-stone-500 font-medium">
          {items.length} {items.length === 1 ? 'article' : 'articles'}
        </span>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <Newspaper size={32} className="text-stone-200" />
          <p className="text-sm text-stone-400">No recent news found</p>
          <p className="text-xs text-stone-300">Check back later for updates</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 } },
          }}
        >
          {items.map((item, i) => (
            <NewsCard key={i} item={item} index={i} />
          ))}
        </motion.div>
      )}
    </Card>
  );
}
