declare module "quagga" {
  interface QuaggaConfig {
    inputStream: {
      name?: string;
      type: string;
      target: HTMLElement;
      constraints?: {
        width?: number | { min: number; max?: number };
        height?: number | { min: number; max?: number };
        facingMode?: string;
        aspectRatio?: { min: number; max: number };
      };
      area?: {
        top?: string;
        right?: string;
        left?: string;
        bottom?: string;
      };
      singleChannel?: boolean;
    };
    locator?: {
      patchSize?: string;
      halfSample?: boolean;
    };
    numOfWorkers?: number;
    frequency?: number;
    decoder?: {
      readers?: string[];
      multiple?: boolean;
      debug?: {
        showCanvas?: boolean;
        showPatches?: boolean;
        showFoundPatches?: boolean;
        showSkeleton?: boolean;
        showLabels?: boolean;
        showPatchLabels?: boolean;
        showRemainingPatchLabels?: boolean;
      };
      drawBoundingBox?: boolean;
      showFrequency?: boolean;
      drawScanline?: boolean;
      showPattern?: boolean;
    };
    locate?: boolean;
  }

  interface QuaggaResult {
    codeResult?: {
      code?: string;
      format?: string;
    };
    box?: any;
    boxes?: any[];
    line?: any;
  }

  interface QuaggaCanvas {
    ctx: {
      overlay: CanvasRenderingContext2D;
    };
    dom: {
      overlay: HTMLCanvasElement;
    };
  }

  interface QuaggaImageDebug {
    drawPath: (
      path: any,
      start: any,
      ctx: CanvasRenderingContext2D,
      style: any
    ) => void;
  }

  interface CameraTrack {
    applyConstraints: (constraints: any) => Promise<void>;
  }

  interface CameraAccess {
    getActiveTrack: () => CameraTrack;
  }

  const Quagga: {
    init: (config: QuaggaConfig, callback: (err?: any) => void) => void;
    start: () => void;
    stop: () => void;
    onDetected: (callback: (result: QuaggaResult) => void) => void;
    onProcessed: (callback: (result: QuaggaResult) => void) => void;
    canvas: QuaggaCanvas;
    ImageDebug: QuaggaImageDebug;
    CameraAccess: CameraAccess;
  };

  export default Quagga;
}
