import {
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect } from "react";

interface AnimatedNumberProps {
  value: number;
  format: (value: number) => string;
  className?: string;
}

/**
 * A figure that rolls to its new value instead of snapping.
 *
 * Used where a number answers a control the user is moving: the change is
 * the information, and a spring makes the size of the change legible.
 * Under reduced motion it renders the value directly.
 */
export function AnimatedNumber({
  value,
  format,
  className,
}: AnimatedNumberProps) {
  const reduce = useReducedMotion();
  const spring = useSpring(value, { stiffness: 170, damping: 26, mass: 0.6 });
  const text = useTransform(spring, (v) => format(v));

  useEffect(() => {
    if (reduce) {
      spring.jump(value);
    } else {
      spring.set(value);
    }
  }, [value, reduce, spring]);

  if (reduce) return <span className={className}>{format(value)}</span>;

  return <motion.span className={className}>{text}</motion.span>;
}
