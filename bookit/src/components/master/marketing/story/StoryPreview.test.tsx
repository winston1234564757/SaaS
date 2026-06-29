// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: () => (props: Record<string, unknown>) => <div>{props.children as React.ReactNode}</div> }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./StoryCanvas', () => ({ StoryCanvas: () => <div data-testid="canvas" /> }));

import { StoryPreview } from './StoryPreview';
import type { CanvasProps } from './storyTypes';

const cp = { mode: 'announcement', annoText: 'Hi', transparency: 38, platePos: 'center', textAlign: 'center', showAvatar: true } as unknown as CanvasProps;

describe('StoryPreview', () => {
  it('рендерить canvas', () => {
    render(<StoryPreview canvasProps={cp} scale={0.7} radius={14} isBlurLocked={false} isPremiumLocked={false} blurActive={false} upgradeCopy={null} />);
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
  });
  it('показує upgrade-оверлей коли заблоковано', () => {
    render(<StoryPreview canvasProps={cp} scale={0.7} radius={14} isBlurLocked={true} isPremiumLocked={true} blurActive={true} upgradeCopy={{ overlayTitle: 'Тільки PRO', overlayHint: '700грн', modalTitle: '', modalDesc: '', teaserTitle: '', teaserDesc: '' }} />);
    expect(screen.getByText('Тільки PRO')).toBeInTheDocument();
  });
});
