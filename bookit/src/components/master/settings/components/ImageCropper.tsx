'use client';

import { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedAreaPixels: Area) => void;
  aspect?: number;
}

export function ImageCropper({ image, onCropComplete, aspect = 3 / 4 }: ImageCropperProps) {
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
