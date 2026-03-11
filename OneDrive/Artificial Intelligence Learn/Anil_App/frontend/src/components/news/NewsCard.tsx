import type { NewsItem } from '../../types/analysis';

interface NewsCardProps {
  item: NewsItem;
}

const sentimentColor: Record<string, string> = {
  positive: 'text-emerald-400',
  negative: 'text-red-400',
  neutral: 'text-gray-500',
};

export function NewsCard({ item }: NewsCardProps) {
  const sentimentClass =
    item.sentiment !== null ? (sentimentColor[item.sentiment] ?? 'text-gray-500') : 'text-gray-500';

  return (
    <div className="block p-3 rounded-lg hover:bg-gray-800/50 transition-colors">
      <h5 className="text-sm text-gray-200 hover:text-white leading-snug">
        {item.title}
      </h5>
      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
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
