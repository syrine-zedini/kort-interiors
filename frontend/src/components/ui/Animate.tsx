/**
 * Composants d'animation réutilisables — Framer Motion
 * Style luxe : lent, subtil, élégant
 */
import { motion, Variants, HTMLMotionProps } from "framer-motion";

/* ─── Variantes partagées ──────────────────────────────────────── */

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
  },
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.9, ease: "easeOut" },
  },
};

export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

export const staggerFastContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0 },
  },
};

/* ─── Composants ───────────────────────────────────────────────── */

interface FadeUpProps extends HTMLMotionProps<"div"> {
  delay?: number;
  children?: React.ReactNode;
}

/** Fade + slide-up déclenché au scroll (once) */
export function FadeUp({ delay = 0, children, ...props }: FadeUpProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: { opacity: 0, y: 28 },
        visible: {
          opacity: 1, y: 0,
          transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1], delay },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Simple fade in déclenché au scroll */
export function FadeIn({ delay = 0, children, ...props }: FadeUpProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { duration: 0.9, ease: "easeOut", delay },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Conteneur qui échelonne ses enfants au scroll */
export function StaggerContainer({ children, ...props }: HTMLMotionProps<"div"> & { children: React.ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={staggerContainerVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Élément enfant pour StaggerContainer */
export function StaggerItem({ children, ...props }: HTMLMotionProps<"div"> & { children: React.ReactNode }) {
  return (
    <motion.div variants={fadeUpVariants} {...props}>
      {children}
    </motion.div>
  );
}

/** Animation de révélation dès le mount (pas scroll) — pour le hero */
export function RevealOnMount({ delay = 0, children, ...props }: FadeUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Ligne séparatrice qui s'étend de gauche à droite */
export function LineReveal({ delay = 0, color = "rgba(255,255,255,0.3)" }: { delay?: number; color?: string }) {
  return (
    <motion.div
      initial={{ scaleX: 0, originX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay }}
      style={{ height: "1px", background: color, transformOrigin: "left" }}
    />
  );
}
