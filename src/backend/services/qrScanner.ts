import { Html5Qrcode } from 'html5-qrcode';
import { FoodItem } from '../models/types';

export interface QRScanResult {
  rawText: string;
  formatName?: string;
  parsedItem?: {
    name: string;
    category: FoodItem['category'];
    expiryDate: string;
    price: number;
    quantity: number;
  };
}

// Sample product mapping for standard food product barcodes (EAN-13 / UPC)
const BARCODE_PRODUCT_DATABASE: Record<string, { name: string; category: FoodItem['category']; defaultShelfDays: number; price: number }> = {
  '8901030384812': { name: 'Amul Taaza Toned Milk (1L)', category: 'dairy', defaultShelfDays: 5, price: 54 },
  '8901262010057': { name: 'Amul Malai Paneer 200g', category: 'dairy', defaultShelfDays: 7, price: 95 },
  '8901725111228': { name: 'Britannia Whole Wheat Bread', category: 'bakery', defaultShelfDays: 4, price: 45 },
  '8901058000411': { name: 'Nestle Dahi / Curd 400g', category: 'dairy', defaultShelfDays: 8, price: 50 },
  '8901030678901': { name: 'Mother Dairy Fresh Paneer', category: 'dairy', defaultShelfDays: 6, price: 90 },
  '8901000100100': { name: 'Fresh Organic Eggs (Pack of 6)', category: 'dairy', defaultShelfDays: 14, price: 75 },
};

/**
 * Parses decoded QR code or Barcode text into a structured food item object.
 */
export function parseQRText(rawText: string): QRScanResult {
  const cleanText = rawText.trim();

  // 1. Try parsing JSON payload from QR Code
  try {
    const json = JSON.parse(cleanText);
    if (json && typeof json === 'object') {
      const name = json.name || json.item || json.product || 'Scanned Food Item';
      const category = (['dairy', 'produce', 'meat', 'bakery', 'pantry', 'canned'].includes(json.category)
        ? json.category
        : 'pantry') as FoodItem['category'];
      
      let expiryDate = json.expiryDate || json.expiry || json.expDate;
      if (!expiryDate || isNaN(Date.parse(expiryDate))) {
        // Fallback to 7 days from now
        const target = new Date();
        target.setDate(target.getDate() + 7);
        expiryDate = target.toISOString().split('T')[0];
      }

      return {
        rawText: cleanText,
        parsedItem: {
          name,
          category,
          expiryDate,
          price: Number(json.price) || 60,
          quantity: Number(json.quantity) || 1,
        },
      };
    }
  } catch (e) {
    // Not JSON, fallback to barcode lookup or text extraction
  }

  // 2. Check Barcode Database lookup
  if (BARCODE_PRODUCT_DATABASE[cleanText]) {
    const product = BARCODE_PRODUCT_DATABASE[cleanText];
    const exp = new Date();
    exp.setDate(exp.getDate() + product.defaultShelfDays);

    return {
      rawText: cleanText,
      parsedItem: {
        name: product.name,
        category: product.category,
        expiryDate: exp.toISOString().split('T')[0],
        price: product.price,
        quantity: 1,
      },
    };
  }

  // 3. Fallback text parsing
  const exp = new Date();
  exp.setDate(exp.getDate() + 7);
  return {
    rawText: cleanText,
    parsedItem: {
      name: cleanText.length > 25 ? cleanText.substring(0, 25) + '...' : cleanText,
      category: 'pantry',
      expiryDate: exp.toISOString().split('T')[0],
      price: 50,
      quantity: 1,
    },
  };
}

/**
 * Scan an uploaded image File for QR Code or Barcode using Html5Qrcode
 */
export async function scanQRFromFile(file: File): Promise<QRScanResult | null> {
  // Create container element if not present
  let tempDiv = document.getElementById('qr-temp-reader-element');
  if (!tempDiv) {
    tempDiv = document.createElement('div');
    tempDiv.id = 'qr-temp-reader-element';
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);
  }

  const html5QrCode = new Html5Qrcode('qr-temp-reader-element');
  try {
    const result = await html5QrCode.scanFile(file, true);
    await html5QrCode.clear();
    return parseQRText(result);
  } catch (err) {
    console.warn('QR Code scan from file failed or no QR detected:', err);
    await html5QrCode.clear().catch(() => {});
    return null;
  }
}
