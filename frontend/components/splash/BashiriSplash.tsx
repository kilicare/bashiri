"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cloudinaryUrl } from "@/lib/cloudinary";

const SPLASH_SESSION_KEY = "bashiri_splash_shown";
const DISPLAY_MS = 6000;
const EXIT_MS = 700;

// Nafasi za "particles" zimewekwa TULIVU (si Math.random) ili kuepuka
// hydration mismatch — kila moja ina left%, delay, na muda tofauti.
const PARTICLES = [
  { left: "8%", size: 4, delay: 0.1, duration: 5 },
  { left: "15%", size: 2, delay: 0.8, duration: 7 },
  { left: "22%", size: 3, delay: 0.3, duration: 6 },
  { left: "32%", size: 5, delay: 0.5, duration: 5.5 },
  { left: "42%", size: 2, delay: 1.2, duration: 8 },
  { left: "52%", size: 4, delay: 0.7, duration: 6.5 },
  { left: "62%", size: 3, delay: 0.2, duration: 7.5 },
  { left: "72%", size: 2, delay: 1.5, duration: 8.5 },
  { left: "82%", size: 4, delay: 0.4, duration: 6 },
  { left: "90%", size: 3, delay: 1.0, duration: 7 },
  { left: "95%", size: 2, delay: 0.6, duration: 5.5 },
];

export function BashiriSplash() {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  const alreadySeen =
    typeof window !== "undefined" && sessionStorage.getItem(SPLASH_SESSION_KEY) === "1";

  useEffect(() => {
    if (alreadySeen) {
      router.replace("/home");
      return;
    }
    const displayTimer = setTimeout(() => setExiting(true), DISPLAY_MS);
    return () => clearTimeout(displayTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!exiting) return;
    const exitTimer = setTimeout(() => {
      sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
      router.replace("/home");
    }, EXIT_MS);
    return () => clearTimeout(exitTimer);
  }, [exiting, router]);

  // Mtumiaji anayerudi ndani ya session hiyo hiyo — hakuna splash tena,
  // tunaruka moja kwa moja (background nyeusi tu, imefifia haraka sana).
  if (alreadySeen) {
    return <div className="fixed inset-0" style={{ background: "#0A0A0A" }} />;
  }

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0B1220 0%, #050816 100%)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: exiting ? EXIT_MS / 1000 : 0.6, ease: "easeInOut" }}
    >
      {/* Texture ya "stadium atmosphere" — mwanga hafifu uliofichika, si uwanja halisi */}
      <motion.div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      <motion.div
        className="absolute top-1/4 left-0 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(207,175,123,0.08) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Noise/texture ya kina — grain ndogo isiyoonekana wazi */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.6) 0.5px, transparent 0.5px)",
          backgroundSize: "3px 3px",
        }}
      />

      {/* Particles — chembe ndogo za dhahabu, zinazopaa taratibu */}
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: p.left,
            bottom: "-10px",
            width: p.size,
            height: p.size,
            background: "#D4AF37",
            filter: "blur(0.5px)",
          }}
          initial={{ opacity: 0, y: 0 }}
          animate={{
            opacity: [0, 0.5, 0],
            y: [0, -520],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Glow nyuma ya logo - zaidi dramatic */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 280,
          height: 280,
          background: "radial-gradient(circle, rgba(212,175,55,0.35) 0%, transparent 75%)",
          filter: "blur(25px)",
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ 
          opacity: [0, 1, 0.8, 1],
          scale: [0.5, 1, 1.05, 1],
        }}
        transition={{ 
          duration: 2, 
          delay: 0.2, 
          ease: "easeOut",
          times: [0, 0.5, 0.75, 1],
        }}
      />

      {/* Logo — twiga wa Bashiri, hero element */}
      <motion.img
        src="/icon.png"
        alt="Bashiri"
        className="relative w-24 h-24 object-contain rounded-full"
        animate={{
          opacity: [0, 1],
          scale: [0.9, 1, 1.04, 1],
          boxShadow: [
            '0 0 20px rgba(212,175,55,0.5)',
            '0 0 40px rgba(212,175,55,0.8)',
            '0 0 20px rgba(212,175,55,0.5)',
          ],
        }}
        transition={{
          opacity: { duration: 0.8, delay: 0.4, ease: "easeOut" },
          scale: {
            duration: 1.6,
            delay: 0.4,
            times: [0, 0.5, 0.75, 1],
            ease: "easeInOut",
          },
          boxShadow: { duration: 2.5, repeat: Infinity },
        }}
      />

      {/* Jina na tagline - zaidi dramatic */}
      <motion.div
        className="relative mt-5 text-center"
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
      >
        <motion.p
          className="text-3xl font-black tracking-wide"
          style={{ 
            color: "#FFFFFF",
            textShadow: "0 0 30px rgba(212,175,55,0.5), 0 0 60px rgba(212,175,55,0.3)",
          }}
          animate={{
            textShadow: [
              "0 0 30px rgba(212,175,55,0.5), 0 0 60px rgba(212,175,55,0.3)",
              "0 0 40px rgba(212,175,55,0.7), 0 0 80px rgba(212,175,55,0.5)",
              "0 0 30px rgba(212,175,55,0.5), 0 0 60px rgba(212,175,55,0.3)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          BASHIRI
        </motion.p>
        <motion.p
          className="text-xs mt-2 font-medium tracking-wider"
          style={{ 
            color: "rgba(255,255,255,0.8)",
            textShadow: "0 0 20px rgba(212,175,55,0.3)",
          }}
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          AI Predictions • Live Scores • Insights
        </motion.p>
      </motion.div>

      {/* Progress line nyembamba, ya kifahari */}
      <div className="absolute bottom-16 left-0 right-0 flex justify-center pb-safe">
        <div
          className="w-32 rounded-full overflow-hidden"
          style={{ height: 3, background: "rgba(255,255,255,0.1)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: "#D4AF37" }}
            initial={{ width: "0%" }}
            animate={{ width: exiting ? "100%" : "100%" }}
            transition={{ duration: DISPLAY_MS / 1000, delay: 0.8, ease: "easeInOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}