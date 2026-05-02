'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const BEAUTY_PHRASES = [
  'Шукаємо вільне віконечко... 🗓️',
  'Малюємо ідеальні стрілки... 👁️',
  'Створюємо магію перевтілення... ✨',
  'Підбираємо відтінок під настрій... 🎨',
  'Робимо світ трішки гарнішим... 🌸'
];

interface BeautyLoaderProps {
  message?: string;
}

export function BeautyLoader({ message }: BeautyLoaderProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % BEAUTY_PHRASES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FFE8DC] overflow-hidden">
      {/* Background Blobs for Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#789A99]/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-white/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative flex flex-col items-center">
        {/* Central Animated Icon */}
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className="w-20 h-20 bg-white/80 backdrop-blur-md rounded-[28px] shadow-xl border border-white/40 flex items-center justify-center mb-8"
        >
          <Sparkles className="w-10 h-10 text-[#789A99]" />
        </motion.div>

        {/* Primary Message */}
        {message && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sage font-bold text-sm uppercase tracking-[0.2em] mb-4"
          >
            {message}
          </motion.p>
        )}

        {/* Cycling Beauty Phrases */}
        <div className="h-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={phraseIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="heading-serif text-lg text-foreground italic px-6 text-center"
            >
              {BEAUTY_PHRASES[phraseIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Minimal Progress Line */}
        <div className="mt-12 w-32 h-1 bg-white/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="w-full h-full bg-sage"
          />
        </div>
      </div>
    </div>
  );
}
