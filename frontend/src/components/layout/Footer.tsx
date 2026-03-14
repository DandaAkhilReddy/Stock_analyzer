import { TrendingUp, Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-stone-400">
            <TrendingUp size={16} />
            <span className="text-sm font-medium">Stock Analyzer</span>
            <span className="text-xs">· Powered by AI</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/DandaAkhilReddy/Stock_analyzer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-400 hover:text-stone-600 transition-colors"
            >
              <Github size={18} />
            </a>
          </div>
        </div>
        <p className="text-[10px] text-stone-300 text-center mt-3">
          For informational purposes only. Not financial advice. Past performance does not guarantee future results.
        </p>
      </div>
    </footer>
  );
}
