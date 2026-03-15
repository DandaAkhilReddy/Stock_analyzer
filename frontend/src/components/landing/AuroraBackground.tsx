export function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Primary aurora bands */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-3xl will-change-transform"
        style={{
          top: '5%',
          left: '10%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(99, 102, 241, 0.1) 50%, transparent 70%)',
          animation: 'aurora-1 10s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl will-change-transform"
        style={{
          top: '40%',
          right: '5%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0.08) 50%, transparent 70%)',
          animation: 'aurora-2 14s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-[550px] h-[550px] rounded-full blur-3xl will-change-transform"
        style={{
          bottom: '0%',
          left: '30%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, rgba(6, 182, 212, 0.06) 50%, transparent 70%)',
          animation: 'aurora-3 12s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full blur-3xl will-change-transform"
        style={{
          top: '20%',
          left: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 60%)',
          animation: 'aurora-4 8s ease-in-out infinite',
        }}
      />

      {/* Floating particle dots */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full will-change-transform"
          style={{
            width: p.size,
            height: p.size,
            top: p.top,
            left: p.left,
            background: p.color,
            animation: `float-dot ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Subtle gradient overlay for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(250, 250, 249, 0.6) 100%)',
        }}
      />
    </div>
  );
}

interface Particle {
  size: number;
  top: string;
  left: string;
  color: string;
  duration: number;
  delay: number;
}

const PARTICLES: Particle[] = [
  { size: 3, top: '15%', left: '20%', color: 'rgba(99, 102, 241, 0.5)', duration: 5, delay: 0 },
  { size: 2, top: '25%', left: '70%', color: 'rgba(139, 92, 246, 0.4)', duration: 6, delay: 0.8 },
  { size: 4, top: '55%', left: '15%', color: 'rgba(6, 182, 212, 0.4)', duration: 7, delay: 1.5 },
  { size: 2, top: '40%', left: '85%', color: 'rgba(99, 102, 241, 0.35)', duration: 5.5, delay: 2.2 },
  { size: 3, top: '70%', left: '45%', color: 'rgba(139, 92, 246, 0.45)', duration: 6.5, delay: 0.5 },
  { size: 2, top: '80%', left: '75%', color: 'rgba(16, 185, 129, 0.3)', duration: 5, delay: 3 },
  { size: 3, top: '10%', left: '55%', color: 'rgba(6, 182, 212, 0.35)', duration: 7.5, delay: 1 },
  { size: 2, top: '60%', left: '30%', color: 'rgba(99, 102, 241, 0.4)', duration: 6, delay: 2 },
  { size: 4, top: '35%', left: '40%', color: 'rgba(139, 92, 246, 0.3)', duration: 8, delay: 0.3 },
  { size: 2, top: '85%', left: '60%', color: 'rgba(6, 182, 212, 0.4)', duration: 5.5, delay: 1.8 },
];
