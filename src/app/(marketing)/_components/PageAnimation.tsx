"use client";

import { motion } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";

interface PageAnimationProps {
  children: ReactNode;
}

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    },
  },
};

export default function PageAnimation({ children }: PageAnimationProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Trigger animation on mount/refresh
    setIsMounted(true);
  }, []);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate={isMounted ? "visible" : "hidden"}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

export function AnimatedSection({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

export { itemVariants };

