'use client';

import { StoryGenerator } from '@/components/master/marketing/StoryGenerator';
import { useState } from 'react';

export default function TestStoryPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="p-10 bg-peach min-h-screen">
      <h1 className="text-3xl font-display mb-10 text-center">Story Generator Test Lab</h1>
      
      <div className="max-w-md mx-auto p-6 bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl">
        <p className="text-sm text-muted-foreground mb-4 text-center">
          This page renders the StoryGenerator component for direct debugging.
        </p>
        <button 
          onClick={() => setIsOpen(true)}
          className="w-full py-3 bg-sage text-white rounded-2xl font-bold hover:scale-95 transition-all"
        >
          Open Generator
        </button>
      </div>

      <StoryGenerator 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        masterName="Test Master"
        masterSlug="test-master"
      />
    </div>
  );
}
