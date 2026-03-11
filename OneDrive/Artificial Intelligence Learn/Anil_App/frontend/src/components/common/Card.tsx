interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function Card({ children, className = '', title }: CardProps) {
  return (
    <div
      className={`bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5 transition-all duration-200 hover:bg-white/[0.05] hover:border-white/[0.1] ${className}`}
    >
      {title && <h3 className="text-sm font-medium text-gray-400 mb-3">{title}</h3>}
      {children}
    </div>
  );
}
