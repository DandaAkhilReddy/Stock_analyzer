import { useState } from 'react';
import { Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../common/Card';

interface ResearchSourcesProps {
  researchContext: string;
  researchSources: string[];
}

export function ResearchSources({ researchContext, researchSources }: ResearchSourcesProps) {
  const [expanded, setExpanded] = useState(false);

  if (!researchContext && (!researchSources || researchSources.length === 0)) {
    return null;
  }

  return (
    <Card>
      <button
        type="button"
        className="flex items-center justify-between w-full"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-blue-500" />
          <h4 className="text-sm font-medium text-stone-500">
            Research Sources ({researchSources?.length ?? 0})
          </h4>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-stone-400" />
        ) : (
          <ChevronDown size={16} className="text-stone-400" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {researchContext && (
            <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line">
              {researchContext.slice(0, 500)}
              {researchContext.length > 500 && '...'}
            </p>
          )}

          {researchSources?.length > 0 && (
            <ul className="space-y-1">
              {researchSources.map((url, i) => (
                <li key={i} className="text-xs">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 underline break-all"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
