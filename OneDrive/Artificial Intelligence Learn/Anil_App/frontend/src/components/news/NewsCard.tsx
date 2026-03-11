import type { NewsItem } from '../../types/analysis';

interface NewsCardProps {
  item: NewsItem;
}

const sentimentColor: Record<string, string> = {
  positive: 'text-emerald-600',
  negative: 'text-red-600',
  neutral: 'text-stone-400',
};

export function NewsCard({ item }: NewsCardProps) {
  const sentimentClass =
    item.sentiment !== null ? (sentimentColor[item.sentiment] ?? 'text-stone-400') : 'text-stone-400';

  return (
    <div className="block p-3 rounded-lg hover:bg-stone-100 transition-colors">
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
    </div>
  );
}
