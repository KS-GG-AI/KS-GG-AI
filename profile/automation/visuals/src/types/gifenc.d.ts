// Minimal ambient type declaration for `gifenc`, which ships no types of its
// own. Only the surface used by generate-localized-assets.ts is declared.
declare module "gifenc" {
  export interface GifWriteFrameOptions {
    palette?: number[][];
    delay?: number;
    repeat?: number;
  }

  export interface GIFEncoderInstance {
    writeFrame(index: Uint8Array, width: number, height: number, opts?: GifWriteFrameOptions): void;
    finish(): void;
    bytes(): Uint8Array;
  }

  export function GIFEncoder(): GIFEncoderInstance;
  export function quantize(rgba: Uint8Array, maxColors: number, opts?: { format?: string }): number[][];
  export function applyPalette(rgba: Uint8Array, palette: number[][], format?: string): Uint8Array;

  const gifenc: {
    GIFEncoder: typeof GIFEncoder;
    quantize: typeof quantize;
    applyPalette: typeof applyPalette;
  };
  export default gifenc;
}
