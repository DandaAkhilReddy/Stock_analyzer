import React from 'react';

export function DotGrid(): React.ReactElement {
  return (
    <div
      className="absolute inset-0 opacity-[0.12]"
      style={{
        backgroundImage: 'radial-gradient(circle, #a8a29e 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    />
  );
}
