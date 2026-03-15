import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  gradient?: boolean;
  glow?: boolean;
}

export function Card({ children, className = '', title, gradient = false, glow = false }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(springY, [0, 1], [3, -3]);
  const rotateY = useTransform(springX, [0, 1], [-3, 3]);

  const highlightX = useTransform(springX, [0, 1], [0, 100]);
  const highlightY = useTransform(springY, [0, 1], [0, 100]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = (): void => {
    x.set(0.5);
    y.set(0.5);
  };

  const card = (
    <motion.div
      ref={ref}
      className={`bg-white border border-stone-200 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/8 relative overflow-hidden ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Specular highlight layer */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl z-10"
        style={{
          background: useTransform(
            [highlightX, highlightY],
            ([hx, hy]: number[]) =>
              `radial-gradient(circle at ${hx}% ${hy}%, rgba(255,255,255,0.12), transparent 60%)`
          ),
        }}
      />
      {title && <h3 className="text-sm font-medium text-stone-500 mb-3 relative z-20">{title}</h3>}
      <div className="relative z-20">{children}</div>
    </motion.div>
  );

  if (glow) {
    return (
      <div className="glow-border rounded-2xl">
        {card}
      </div>
    );
  }

  if (gradient) {
    return (
      <div className="bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-indigo-500/10 p-[1px] rounded-2xl">
        {card}
      </div>
    );
  }

  return card;
}
