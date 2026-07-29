import { GoogleGenerativeAI } from '@google/generative-ai';
import { FoodItem } from '../models/types';

export interface ScannedProductResult {
  name: string;
  category: FoodItem['category'];
  expiryDate: string; // YYYY-MM-DD
  confidence: number;
  price: number;
  quantity: number;
  unit: string;
  rawTextDetected: string;
  dateFoundSnippet?: string;
  hasExpiryDate?: boolean;
}

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

// Run Gemini 1.5 Flash Vision OCR on an image source (data URL or canvas frame)
export async function performRealImageOCR(imageSrc: string): Promise<ScannedProductResult> {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    console.error('Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.');
    throw new Error('Gemini API Key is missing');
  }

  try {
    const base64Data = imageSrc.split(',')[1];
    const mimeType = imageSrc.split(';')[0].split(':')[1];

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      You are an expert food product label scanner.
      Analyze this image and extract the following information. Return the result strictly as a JSON object with no markdown formatting.
      Do not include \`\`\`json or \`\`\`. Just raw JSON.
      
      Required fields:
      - "name": The name of the food product. Keep it short (e.g. "Amul Milk", "Tomato").
      - "category": Must be one of exactly these: "dairy", "meat", "vegetables", "pantry", "canned".
      - "expiryDate": The expiry date, use-by date, or best before date formatted strictly as "YYYY-MM-DD". If you see a manufacturing date (MFG, MFD, PKD, Packed), IGNORE IT completely. Only look for expiry. If no expiry date exists, return an empty string "".
      - "confidence": An integer from 0 to 100 representing how confident you are in the expiry date reading.
      - "price": Approximate price in integer (e.g. 50). If unknown, use 65.
      - "quantity": Number (e.g. 1).
      - "unit": "pcs", "L", "g", "kg", "pack" etc.
      - "rawText": Extract the actual line of text where you found the expiry date, exactly as printed on the label (e.g. "EXP 25/12/2026").
    `;

    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType
        }
      }
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text().trim();
    
    // Clean up response if it contains markdown formatting
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(cleanJson);

    return {
      name: parsed.name || 'Scanned Food Product',
      category: parsed.category || 'pantry',
      expiryDate: parsed.expiryDate || '',
      hasExpiryDate: !!parsed.expiryDate,
      confidence: parsed.confidence || 99,
      price: parsed.price || 65,
      quantity: parsed.quantity || 1,
      unit: parsed.unit || 'pcs',
      rawTextDetected: parsed.rawText || 'Processed via Gemini Vision AI',
      dateFoundSnippet: parsed.expiryDate ? 'AI Extracted' : undefined,
    };
  } catch (err: any) {
    console.error('Gemini Vision API error:', err);
    return {
      name: 'API Connection Error',
      category: 'pantry',
      expiryDate: '',
      hasExpiryDate: false,
      confidence: 0,
      price: 0,
      quantity: 1,
      unit: 'pcs',
      rawTextDetected: `Gemini API Error: ${err.message}. Ensure your API key is correct in .env`,
    };
  }
}

// Capture image frame from HTML video element
export function captureFrameFromVideo(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8); // 0.8 quality to keep payload small for API
  }
  return '';
}

export const SAMPLE_PRODUCTS: ScannedProductResult[] = [
  {
    name: 'Amul Taaza Milk 1L',
    category: 'dairy',
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    confidence: 99,
    price: 64,
    quantity: 1,
    unit: 'L',
    hasExpiryDate: true,
    rawTextDetected: 'EXP 28/07/2026',
    dateFoundSnippet: 'EXP 28/07/2026',
  },
  {
    name: 'Chicken Breast 500g',
    category: 'meat',
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    confidence: 99,
    price: 280,
    quantity: 500,
    unit: 'g',
    hasExpiryDate: true,
    rawTextDetected: 'USE BY 28-07-2026',
    dateFoundSnippet: 'USE BY 28-07-2026',
  },
  {
    name: 'Sliced Whole Wheat Bread',
    category: 'pantry',
    expiryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    confidence: 99,
    price: 45,
    quantity: 1,
    unit: 'pack',
    hasExpiryDate: true,
    rawTextDetected: 'BEST BEFORE 30 JUL 2026',
    dateFoundSnippet: 'BEST BEFORE 30 JUL 2026',
  },
];
