"use client";

import Image from "next/image";
import { useState } from "react";

interface PostImageGalleryProps {
  images: string[];
}

export default function PostImageGallery({ images }: PostImageGalleryProps) {
  const displayImages = images.slice(0, 4);
  const hasOverflow = images.length > 4;

  const [scrollIndex, setScrollIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleNext = () => {
    if (scrollIndex < images.length - 4) setScrollIndex(scrollIndex + 1);
  };
  const handlePrev = () => {
    if (scrollIndex > 0) setScrollIndex(scrollIndex - 1);
  };

  const visibleImages = hasOverflow
    ? images.slice(scrollIndex, scrollIndex + 4)
    : displayImages;

    if(images.length > 0){
    return (
      <div className="relative w-full max-w-lg mx-auto">
        {/* Image grid */}
        <div
          className={`grid gap-1 ${
            visibleImages.length === 1
              ? "grid-cols-1"
              : visibleImages.length === 2
              ? "grid-cols-2"
              : "grid-cols-2"
          }`}
        >
          {visibleImages.map((src, i) => (
            <div
              key={i}
              className="relative aspect-square w-full overflow-hidden cursor-pointer rounded-lg"
              onClick={() => setSelectedImage(src)}
            >
              <Image
                src={src}
                alt={`Post image ${i + 1}`}
                fill
                className="object-cover hover:opacity-90 transition"
              />
            </div>
          ))}
        </div>

        {/* Scroll buttons for overflow */}
        {hasOverflow && (
          <div className="flex justify-between mt-2">
            <button
              onClick={handlePrev}
              disabled={scrollIndex === 0}
              className="px-2 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
            >
              ◀
            </button>
            <button
              onClick={handleNext}
              disabled={scrollIndex >= images.length - 4}
              className="px-2 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
            >
              ▶
            </button>
          </div>
        )}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 overflow-y-auto"
            onClick={() => setSelectedImage(null)}
            >
              <div
                className="relative mx-auto my-10 max-w-3xl w-[90%] flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-md text-sm"
                    onClick={() => setSelectedImage(null)}
                    >
                      X
                    </button>
                    <Image
                      src={selectedImage}
                      alt="Expanded post image"
                      width={500}
                      height={500}
                      className="object-contain max-h-[90vh] w-auto rounded-md"
                        />
                        </div>
                      </div>
                    )}
                    </div>
    );
}
}
