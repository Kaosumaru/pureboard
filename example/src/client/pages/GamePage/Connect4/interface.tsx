import { motion } from 'motion/react';
import { ReactNode } from 'react';

export enum FieldType {
  Empty,
  X,
  O,
}

export function createMotionDiv(className: string): ReactNode {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={{
        duration: 0.4,
        scale: { type: 'spring', visualDuration: 0.4, bounce: 0.5 },
      }}
      className={className}
    />
  );
}

export function createContent(field: FieldType, isLastMove = false): ReactNode {
  switch (field) {
    case FieldType.X:
      return createMotionDiv('cf-token-X', isLastMove);
    case FieldType.O:
      return createMotionDiv('cf-token-O', isLastMove);
    default:
      return <div></div>;
  }
}
