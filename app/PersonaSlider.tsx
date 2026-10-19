"use client";

import { useState, useEffect } from "react";
import { AVATARS, Avatar } from "@/lib/avatars";

export function PersonaSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Change slide every 3 seconds
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % AVATARS.length);
    }, 3000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="sm:hidden w-full overflow-hidden pb-6">
      {/* Sliding Track */}
      <div 
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {AVATARS.map((a) => (
          <div 
            key={`mobile-${a.id}`} 
            className="w-full flex-shrink-0 px-4 flex justify-center"
          >
            <div className="w-full max-w-sm p-6 rounded-3xl bg-surface-base border border-brand-600 flex flex-col items-center text-center">
              <div className="mb-4 relative">
                <div className="animate-[bounce_3s_infinite]">
                  <Avatar id={a.id} className="w-24 h-24 shadow-xl" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">{a.name}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{a.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {AVATARS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex ? "bg-white w-6" : "bg-white/40 w-1.5"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}