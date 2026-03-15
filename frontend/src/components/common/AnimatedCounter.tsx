import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1200,
  className = '',
}: AnimatedCounterProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  // Initialize to the actual value so the initial render is correct (SSR / tests / no-JS).
  // Animation only fires on subsequent value changes.
  const [displayValue, setDisplayValue] = useState<string>(format(value, decimals));
  const prevValue = useRef(value);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    const start = prevValue.current;
    const end = value;
    const startTime = performance.now();

    let rafId: number;

    const tick = (now: number): void => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;

      el.textContent = `${prefix}${format(current, decimals)}${suffix}`;

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        // Final setState for React consistency
        setDisplayValue(format(end, decimals));
        prevValue.current = end;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value, prefix, suffix, decimals, duration]);

  return (
    <span ref={spanRef} className={className}>
      {prefix}{displayValue}{suffix}
    </span>
  );
}

function format(num: number, decimals: number): string {
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
