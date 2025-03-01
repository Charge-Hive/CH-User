declare module 'react-native-tesseract-ocr' {
    export interface TesseractOCRResult {
      text: string;
    }
  
    export interface TesseractOCRProgress {
      progress: number;
      status: string;
    }
  
    export interface TesseractOCROptions {
      logger?: (progress: TesseractOCRProgress) => void;
    }
  
    export default class TesseractOCR {
      static recognize(
        imagePath: string,
        language: string,
        options?: TesseractOCROptions
      ): Promise<{ data: { text: string } }>;
    }
  }