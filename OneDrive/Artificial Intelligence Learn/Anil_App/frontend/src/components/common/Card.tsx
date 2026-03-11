interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function Card({ children, className = '', title }: CardProps) {
  return (
    <div
      className={`bg-white border border-stone-200 rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-md ${className}`}
    >
      {title && <h3 className="text-sm font-medium text-stone-500 mb-3">{title}</h3>}
      {children}
    </div>
  );
}
