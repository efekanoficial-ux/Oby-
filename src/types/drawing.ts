export type DrawingType = "horizontal" | "vertical" | "trend";

export interface DrawingItem {
  id: string;
  type: DrawingType;
  color: string;
  width: number;
  dashed?: boolean;
  // For horizontal line
  price?: number;
  // For vertical line (time in seconds)
  time?: number;
  // For trend line (2 points)
  p1?: { time: number; price: number };
  p2?: { time: number; price: number };
}
