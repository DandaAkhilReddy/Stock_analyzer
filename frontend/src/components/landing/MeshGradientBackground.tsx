import { motion } from "framer-motion";

export function MeshGradientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full bg-indigo-400/30 blur-3xl"
        style={{ top: "10%", left: "15%" }}
        animate={{ x: [0, 100, -50, 0], y: [0, -80, 60, 0], scale: [1, 1.2, 0.9, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full bg-violet-400/25 blur-3xl"
        style={{ top: "50%", right: "10%" }}
        animate={{ x: [0, -70, 40, 0], y: [0, 50, -90, 0], scale: [1, 0.85, 1.15, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[450px] h-[450px] rounded-full bg-cyan-300/20 blur-3xl"
        style={{ bottom: "5%", left: "40%" }}
        animate={{ x: [0, 60, -80, 0], y: [0, -40, 30, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Sparkle dots */}
      <motion.div
        className="absolute w-2 h-2 rounded-full bg-indigo-400/50"
        style={{ top: "25%", left: "65%" }}
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.5, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-1.5 h-1.5 rounded-full bg-violet-400/40"
        style={{ top: "60%", left: "20%" }}
        animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.2, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, delay: 1.5, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-2 h-2 rounded-full bg-cyan-400/40"
        style={{ top: "45%", right: "25%" }}
        animate={{ opacity: [0, 0.9, 0], scale: [0.5, 1, 0.5] }}
        transition={{ duration: 3.5, repeat: Infinity, delay: 2.5, ease: "easeInOut" }}
      />
    </div>
  );
}
