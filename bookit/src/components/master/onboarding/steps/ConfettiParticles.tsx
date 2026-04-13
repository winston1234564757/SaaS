'use client';

import { motion } from 'framer-motion';

const CONFETTI_COLORS = ['#789A99', '#FFB4A0', '#5C9E7A', '#D4935A', '#C8A4C8', '#A8D8D8'];

export function ConfettiParticles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    x: 5 + (i / 18) * 90,
    delay: (i / 18) * 0.5,
    duration: 1.4 + (i % 3) * 0.3,
    size: 5 + (i % 4) * 3,
    rotate: (i * 47) % 360,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: '110%', x: `${p.x}%`, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ y: '-15%', opacity: 0, rotate: p.rotate, scale: 0.4 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
          className="absolute bottom-0 rounded-sm"
          style={{ width: p.size, height: p.size, background: p.color }}
        />
      ))}
    </div>
  );
}
