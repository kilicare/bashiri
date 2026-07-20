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
    <div className="px-3 pt-2 pb-4">
      <div className="relative w-full h-72 sm:h-80 md:h-96 rounded-3xl overflow-hidden" style={{ background: "#111111" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            className="absolute inset-0"
            style={{
              cursor: slide.route ? "pointer" : "default",
              backgroundImage: `linear-gradient(180deg, rgba(10,10,10,0.1) 30%, rgba(10,10,10,0.92) 100%), url(${slide.image_url})`,
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
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: slide.accent_color }}>
                {slide.subtitle}
              </p>
              <p className="text-xl font-semibold text-white mb-3 leading-tight sm:text-2xl">{slide.title}</p>
              {slide.route && slide.cta_label && (
                <button
                  className="text-sm font-bold px-4 py-2.5 rounded-full sm:text-base sm:px-5 sm:py-3"
                  style={{ background: slide.accent_color, color: "#051006" }}
                >
                  {slide.cta_label} →
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className="rounded-full transition-all"
              style={{
                width: i === index ? 18 : 6,
                height: 6,
                background: i === index ? "var(--success)" : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
