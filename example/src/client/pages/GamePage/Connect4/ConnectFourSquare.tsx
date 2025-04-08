import { createContent, FieldType } from './interface';

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
      {createContent(props.field)}
    </div>
  );
}
