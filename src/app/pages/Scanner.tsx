import { useState, useEffect, useRef } from 'react';
import { Camera, ScanLine, Check, Image as ImageIcon } from 'lucide-react';
import { store } from '../lib/store';
import { FoodItem } from '../lib/types';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

// Mock OCR detected items for demo with prices and quantities
const mockDetectedItems = [
  { name: 'Milk', category: 'dairy' as const, confidence: 95, expiryDate: '2026-02-28', price: 65, quantity: 1, unit: 'L', barcode: '8901234567890' },
  { name: 'Chicken Breast', category: 'meat' as const, confidence: 88, expiryDate: '2026-02-27', price: 350, quantity: 500, unit: 'g', barcode: '8901234567891' },
  { name: 'Banana', category: 'vegetables' as const, confidence: 92, expiryDate: '2026-03-01', price: 40, quantity: 6, unit: 'pieces', barcode: '8901234567892' },
];

export default function Scanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [detectedItems, setDetectedItems] = useState<typeof mockDetectedItems>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [useDemoImage, setUseDemoImage] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isScanning && !useDemoImage && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          // Fallback if camera access denied
          setIsScanning(false);
        });

      // Simulate OCR detection after 2 seconds
      const timer = setTimeout(() => {
        setDetectedItems(mockDetectedItems);
      }, 2000);

      return () => {
        clearTimeout(timer);
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      };
    }
  }, [isScanning]);

  const handleStartScan = () => {
    setIsScanning(true);
    setUseDemoImage(false);
    setDetectedItems([]);
    setSelectedItems(new Set());
  };

  const handleDemoScan = () => {
    setUseDemoImage(true);
    setIsScanning(true);
    setDetectedItems([]);
    setSelectedItems(new Set());
    
    // Simulate OCR detection after 2 seconds
    setTimeout(() => {
      setDetectedItems(mockDetectedItems);
    }, 2000);
  };

  const handleToggleItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const handleAddItems = () => {
    const itemsToAdd = detectedItems
      .filter((_, index) => selectedItems.has(index))
      .map(item => ({
        id: `${Date.now()}-${Math.random()}`,
        name: item.name,
        category: item.category,
        expiryDate: item.expiryDate,
        addedDate: new Date().toISOString(),
        freshnessScore: 100,
        confidence: item.confidence,
        price: item.price,
        quantity: item.quantity,
        unit: item.unit,
        barcode: item.barcode,
      }));

    itemsToAdd.forEach(item => store.addItem(item));

    // Reset
    setIsScanning(false);
    setDetectedItems([]);
    setSelectedItems(new Set());
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#86A789]/5 to-white pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900">FreshKeep</h1>
          <p className="text-sm text-gray-600 mt-1">Scan expiry dates with AI</p>
        </div>

        {/* Camera View */}
        <div className="px-6">
          <div className="relative aspect-[3/4] bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
            {isScanning ? (
              <>
                {useDemoImage ? (
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1632313911469-4b07c534ea16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwZXhwaXJhdGlvbiUyMGRhdGUlMjBsYWJlbHxlbnwxfHx8fDE3NzE5OTM3MDV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Expiry date example"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-40 border-2 border-white rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#86A789] rounded-tl-2xl" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#86A789] rounded-tr-2xl" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#86A789] rounded-bl-2xl" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#86A789] rounded-br-2xl" />
                    
                    {/* Scanning Line Animation */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#86A789] animate-pulse" 
                         style={{ animation: 'scan 2s ease-in-out infinite' }} />
                  </div>
                </div>

                {detectedItems.length === 0 && (
                  <div className="absolute bottom-8 left-0 right-0 text-center">
                    <p className="text-white text-sm bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full inline-block">
                      Looking for expiry dates...
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#86A789]/20 to-[#86A789]/5">
                <div className="w-20 h-20 rounded-full bg-[#86A789]/20 flex items-center justify-center mb-4">
                  <Camera className="w-10 h-10 text-[#86A789]" />
                </div>
                <p className="text-gray-600">Point camera at expiry date</p>
              </div>
            )}
          </div>

          {/* Scan Button */}
          {!isScanning && (
            <div className="flex flex-col items-center gap-3 mt-6">
              <button
                onClick={handleStartScan}
                className="bg-[#86A789] text-white px-8 py-4 rounded-full font-medium shadow-lg hover:bg-[#6d8c70] transition-colors flex items-center gap-2"
              >
                <ScanLine className="w-5 h-5" />
                Start Scanning
              </button>
              
              <button
                onClick={handleDemoScan}
                className="bg-white text-[#86A789] px-6 py-3 rounded-full font-medium border-2 border-[#86A789] hover:bg-[#86A789]/5 transition-colors flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Try Demo Image
              </button>
            </div>
          )}
        </div>

        {/* Detected Items Panel */}
        {detectedItems.length > 0 && (
          <div className="mt-6 px-6">
            <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Detected Items</h3>
                <span className="text-sm text-gray-500">{detectedItems.length} found</span>
              </div>

              <div className="space-y-2">
                {detectedItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleToggleItem(index)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      selectedItems.has(index)
                        ? 'bg-[#86A789]/10 border-2 border-[#86A789]'
                        : 'bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selectedItems.has(index)
                            ? 'bg-[#86A789] border-[#86A789]'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedItems.has(index) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          Expires: {new Date(item.expiryDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.quantity} {item.unit} • ₹{item.price}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#86A789] font-medium">
                        {item.confidence}% match
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleAddItems}
                disabled={selectedItems.size === 0}
                className="w-full mt-4 bg-[#86A789] text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#6d8c70] transition-colors"
              >
                Add {selectedItems.size} {selectedItems.size === 1 ? 'Item' : 'Items'} to Pantry
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: 100%; }
        }
      `}</style>
    </div>
  );
}