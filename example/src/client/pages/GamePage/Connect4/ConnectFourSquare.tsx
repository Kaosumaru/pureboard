import { FieldType } from '@shared/stores/connectFourStore';
import { ReactNode } from 'react';
import { motion } from 'motion/react';

export interface ConnectFourSquareProps {
  rowIdx: number;
  colIdx: number;
  field: FieldType;
  isLastMove?: boolean;
  onClick: (rowIdx: number, colIdx: number) => void;
}

export default function ConnectFourSquare(props: ConnectFourSquareProps) {
  return (
    <div className="cf-item" onClick={() => props.onClick(props.rowIdx, props.colIdx)}>
      {createFieldToken(props.field)}
    </div>
  );
}

export function createFieldToken(field: FieldType): ReactNode {
  switch (field) {
    case FieldType.X:
      return createMotionDiv('cf-token-X');
    case FieldType.O:
      return createMotionDiv('cf-token-O');
    default:
      return <div></div>;
  }
}

function createMotionDiv(className: string): ReactNode {
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
