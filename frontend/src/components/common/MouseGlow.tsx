import { useEffect, useRef } from 'react';

export function MouseGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rafId: number;
    const handleMouseMove = (e: MouseEvent): void => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        el.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`;
        el.style.opacity = '1';
      });
    };

    const handleMouseLeave = (): void => {
      el.style.opacity = '0';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="fixed w-[600px] h-[600px] rounded-full pointer-events-none z-0"
      style={{
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.07) 0%, rgba(139, 92, 246, 0.03) 40%, transparent 70%)',
        opacity: 0,
        transition: 'opacity 0.4s ease',
        willChange: 'transform',
      }}
    />
  );
}
