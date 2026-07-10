'use client';

import { useState } from 'react';
import type { ComponentType } from 'react';
import dynamic from 'next/dynamic';
import type { Area, Point } from 'react-easy-crop';

// react-easy-crop — важка ліба, потрібна лише всередині crop-дровера.
// Типи вище стираються на компіляції, тож рантайм тягнеться тільки тут.
// Обгортка `dynamic` втрачає defaultProps ліби (aspect стає обов'язковим),
// тож типізуємо її під фактичний виклик нижче.
type LazyCropperProps = {
  image: string;
  crop: Point;
  zoom: number;
  aspect?: number;
  onCropChange: (crop: Point) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
  classes?: { containerClassName?: string; mediaClassName?: string };
};

const Cropper = dynamic(() => import('react-easy-crop'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-secondary" />,
}) as ComponentType<LazyCropperProps>;

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedAreaPixels: Area) => void;
  aspect?: number; // undefined = free crop
}

export function ImageCropper({ image, onCropComplete, aspect }: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const onCropChange = (newCrop: Point) => {
    setCrop(newCrop);
  };

  const onZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const handleCropComplete = (_croppedArea: Area, croppedAreaPixels: Area) => {
    onCropComplete(croppedAreaPixels);
  };

  return (
    <div className="relative w-full max-w-full aspect-[3/4] rounded-2xl overflow-hidden bg-black/5">
      <Cropper
        image={image}
        crop={crop}
        zoom={zoom}
        aspect={aspect}
        onCropChange={onCropChange}
        onZoomChange={onZoomChange}
        onCropComplete={handleCropComplete}
        classes={{
          containerClassName: 'rounded-2xl',
          mediaClassName: 'rounded-2xl',
        }}
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[80%] z-10">
        <input
          type="range"
          value={zoom}
          min={1}
          max={3}
          step={0.1}
          aria-label="Масштаб"
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="w-full h-1.5 bg-white/30 accent-primary rounded-lg appearance-none cursor-pointer backdrop-blur-md"
        />
      </div>
    </div>
  );
}
