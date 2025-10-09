"use client";
import { useState } from "react";
import Image from "next/image";

type PostImageGalleryProps = {
  images: string[];  
};

export default function PostImageGallery({images}: PostImageGalleryProps){
    const [currentImage, setCurrentImage] = useState<string | null>(null);

    if(!images || images.length === 0)return null;

    //Limiting images to 4 for preview
    const displayImages = images.slice(0,4);

    return (
         <div className="mt-3">
      <div className="grid grid-cols-2 gap-2">
        {displayImages.map((src, index) => (
          <div key={index} className="relative">
            <Image
              src={src}
              alt={`Post image ${index + 1}`}
              width={300}
              height={300}
              className="rounded-lg object-cover cursor-pointer"
              onClick={() => setCurrentImage(src)}
            />
            {images.length > 4 && index === 3 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-lg font-semibold">
                +{images.length - 4}
              </div>
            )}
          </div>
        ))}
      </div>

      {currentImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center"
          onClick={() => setCurrentImage(null)}
        >
          <Image
            src={currentImage}
            alt="Full view"
            width={800}
            height={800}
            className="rounded-lg object-contain max-h-[90vh]"
          />
        </div>
      )}
    </div>



    );
}