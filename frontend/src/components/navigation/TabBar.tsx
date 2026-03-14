import { motion } from 'framer-motion';
import { LineChart, Newspaper, BarChart3, Info, TrendingUp } from 'lucide-react';
import type { AnalysisTab } from '../../types/analysis';

interface TabConfig {
  id: AnalysisTab;
  label: string;
  icon: typeof LineChart;
}

const tabs: TabConfig[] = [
  { id: 'chart', label: 'Chart', icon: LineChart },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'financials', label: 'Financials', icon: BarChart3 },
  { id: 'about', label: 'About', icon: Info },
  { id: 'invest', label: 'Invest', icon: TrendingUp },
];

interface TabBarProps {
  activeTab: AnalysisTab;
  onTabChange: (tab: AnalysisTab) => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="bg-stone-100 rounded-2xl p-1 inline-flex gap-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'text-indigo-600'
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="tab-active-pill"
                className="absolute inset-0 bg-white shadow-sm rounded-xl"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              <Icon size={16} />
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
