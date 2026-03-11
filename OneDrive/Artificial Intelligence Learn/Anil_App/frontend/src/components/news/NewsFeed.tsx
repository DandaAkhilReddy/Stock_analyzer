import { Newspaper } from 'lucide-react';
import { Card } from '../common/Card';
import { NewsCard } from './NewsCard';
import type { NewsItem } from '../../types/analysis';

interface NewsFeedProps {
  items: NewsItem[];
}

export function NewsFeed({ items }: NewsFeedProps) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <Newspaper size={16} className="text-gray-400" />
        <h4 className="text-sm font-medium text-gray-400">Latest News</h4>
        <span className="text-xs text-gray-600 ml-auto">{items.length} articles</span>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No recent news found</p>
        ) : (
          items.map((item, i) => <NewsCard key={i} item={item} />)
        )}
      </div>
    </Card>
  );
}
