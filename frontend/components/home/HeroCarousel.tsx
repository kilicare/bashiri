"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { getHeroSlides, HeroSlide } from "@/lib/api/hero-carousel";

const AUTOPLAY_MS = 5500;

export function HeroCarousel() {
  const router = useRouter();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getHeroSlides().then((data) => setSlides(data.slides)).catch(() => {});
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    startAutoplay();
    return stopAutoplay;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  function startAutoplay() {
    stopAutoplay();
    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, AUTOPLAY_MS);
  }

  function stopAutoplay() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function goTo(i: number) {
    setIndex((i + slides.length) % slides.length);
    startAutoplay();
  }

  function handleDragEnd(_e: unknown, info: PanInfo) {
    if (info.offset.x < -60) goTo(index + 1);
    else if (info.offset.x > 60) goTo(index - 1);
    else startAutoplay();
  }

  function handleClick(slide: HeroSlide) {
    if (slide.route) router.push(slide.route);
  }

  if (slides.length === 0) return null;

  const slide = slides[index];

  return (
    <div className="py-6">
      <div className="relative w-full h-80 sm:h-96 md:h-[28rem] lg:h-[32rem] rounded-3xl overflow-hidden" style={{ 
        background: "var(--surface)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 1px var(--border), inset 0 1px 0 var(--border)"
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            className="absolute inset-0"
            style={{
              cursor: slide.route ? "pointer" : "default",
              backgroundImage: `linear-gradient(180deg, rgba(9,9,11,0.05) 0%, rgba(9,9,11,0.3) 40%, rgba(9,9,11,0.85) 80%, rgba(9,9,11,0.95) 100%), radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.2) 100%), url(${slide.image_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragStart={stopAutoplay}
            onDragEnd={handleDragEnd}
            onClick={() => handleClick(slide)}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4 }}
          >
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-12">
              <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: slide.accent_color, letterSpacing: "0.15em", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                {slide.subtitle}
              </p>
              <p className="text-2xl font-semibold mb-6 leading-tight sm:text-3xl lg:text-4xl" style={{ color: "var(--text-primary)", textShadow: "0 4px 12px rgba(0,0,0,0.6)" }}>{slide.title}</p>
              {slide.route && slide.cta_label && (
                <button
                  className="text-sm font-bold px-8 py-4 rounded-full sm:text-base sm:px-10 sm:py-4.5 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--background)]"
                  style={{
                    background: slide.accent_color,
                    color: "var(--background)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.4), 0 0 24px rgba(212,175,55,0.3)"
                  }}
                >
                  {slide.cta_label} →
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className="rounded-full transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
              style={{
                width: i === index ? 32 : 10,
                height: 10,
                background: i === index ? "var(--brand-accent)" : "var(--border)",
                boxShadow: i === index ? "0 0 20px rgba(212,175,55,0.6), 0 0 40px rgba(212,175,55,0.3)" : "none"
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
