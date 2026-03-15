import { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Clock } from 'lucide-react';
import type { NewsItem } from '../../types/analysis';

const pingVariants = {
  positive: { animate: { scale: [1, 1.5, 1.5], opacity: [0.4, 0, 0] }, color: 'bg-emerald-400' },
  negative: { animate: { scale: [1, 1.5, 1.5], opacity: [0.4, 0, 0] }, color: 'bg-red-400' },
};

interface NewsCardProps {
  item: NewsItem;
  index?: number;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return '';
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const sentimentStyles: Record<string, { bg: string; text: string; border: string; label: string }> = {
  positive: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Bullish' },
  negative: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Bearish' },
  neutral: { bg: 'bg-stone-50', text: 'text-stone-600', border: 'border-stone-200', label: 'Neutral' },
};

const fallbackSentiment = sentimentStyles['neutral'];

export function NewsCard({ item, index = 0 }: NewsCardProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const sentiment = item.sentiment !== null ? (sentimentStyles[item.sentiment] ?? fallbackSentiment) : fallbackSentiment;
  const relTime = timeAgo(item.published_date);
  const hasImage = item.image_url !== null && item.image_url !== '' && !imgError;

  const cardContent = (
    <motion.div
      className="relative flex items-start gap-3 p-4 bg-white border border-stone-200 rounded-xl
                 hover:shadow-md transition-shadow duration-200 cursor-pointer group"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      whileHover={{ y: -2, boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}
    >
      {/* Thumbnail */}
      {hasImage && (
        <img
          src={item.image_url as string}
          alt=""
          className={`w-12 h-12 rounded-lg object-cover shrink-0 bg-stone-100 transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onError={() => setImgError(true)}
          onLoad={() => setImgLoaded(true)}
        />
      )}

      {/* Body */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-stone-800 leading-snug line-clamp-2 mb-1.5">
          {item.title}
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Source badge */}
          {item.source !== null && item.source !== '' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
                             bg-stone-100 text-stone-500 font-medium">
              {item.source}
            </span>
          )}

          {/* Relative time */}
          {relTime !== '' && (
            <span className="inline-flex items-center gap-0.5 text-xs text-stone-400">
              <Clock size={11} />
              {relTime}
            </span>
          )}

          {/* Sentiment pill */}
          <span className="relative inline-flex items-center">
            {(item.sentiment === 'positive' || item.sentiment === 'negative') && (
              <motion.span
                className={`absolute inset-0 rounded-full ${pingVariants[item.sentiment].color}`}
                animate={pingVariants[item.sentiment].animate}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
            <span
              className={`relative inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                          border ${sentiment.bg} ${sentiment.text} ${sentiment.border}`}
            >
              {sentiment.label}
            </span>
          </span>
        </div>
      </div>

      {/* External link icon — visible on hover */}
      {item.url !== null && item.url !== '' && (
        <span className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <ExternalLink size={13} className="text-stone-400" />
        </span>
      )}
    </motion.div>
  );

  if (item.url !== null && item.url !== '') {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
        {cardContent}
      </a>
    );
  }

  return cardContent;
}
