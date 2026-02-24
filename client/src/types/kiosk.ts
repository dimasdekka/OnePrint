export type KioskState =
  | "waiting"
  | "uploaded"
  | "configured"
  | "payment"
  | "printing";

export type PrintConfig = {
  copies: number;
  colorMode: "bw" | "color";
  pageRange: string;
  estimatedPages: number;
};
