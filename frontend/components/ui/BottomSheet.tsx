"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ReactNode } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.85)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl pb-safe"
            style={{ background: "#111111", border: "1px solid rgba(0,255,135,0.15)", borderBottom: "none" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-2" style={{ background: "rgba(255,255,255,0.2)" }} />
            <div className="flex items-center justify-between px-5 pt-2 pb-3">
              {title && <h2 className="text-lg font-black text-white">{title}</h2>}
              <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center ml-auto bg-white/5">
                <X size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
              </button>
            </div>
            <div className="px-5 pb-24">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}