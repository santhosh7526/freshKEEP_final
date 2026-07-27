 import { useState, useEffect, useRef } from 'react';
import { Camera, ScanLine, Sparkles, Calendar, Bell, Upload, CheckCircle2, RefreshCw } from 'lucide-react';
import { store } from '../lib/store';
import { FoodItem } from '../lib/types';
import { notifyItemAddedWithExpiry, requestNotificationPermission } from '../lib/notifications';
import { SAMPLE_PRODUCTS, ScannedProductResult, captureFrameFromVideo, performRealImageOCR } from '../lib/ocrScanner';

export default function Scanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [useDemoMode, setUseDemoMode] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedProduct, setDetectedProduct] = useState<ScannedProductResult | null>(null);
  
  // Form fields for verifying/editing detected item
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<FoodItem['category']>('dairy');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editPrice, setEditPrice] = useState<number>(50);
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editUnit, setEditUnit] = useState<string>('pcs');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize camera stream when scanning starts
  useEffect(() => {
    let streamInstance: MediaStream | null = null;

    if (isScanning && !useDemoMode && !capturedImage) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } })
        .then(stream => {
          streamInstance = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.warn('Camera access denied or unavailable, switching to photo upload mode', err);
        });

      return () => {
        if (streamInstance) {
          streamInstance.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current?.srcObject) {
          const s = videoRef.current.srcObject as MediaStream;
          s.getTracks().forEach(track => track.stop());
        }
      };
    }
  }, [isScanning, useDemoMode, capturedImage]);

  const handleStartScan = async () => {
    setSavedSuccess(false);
    setIsScanning(true);
    setUseDemoMode(false);
    setCapturedImage(null);
    setDetectedProduct(null);
    await requestNotificationPermission();
  };

  const handleDemoScan = (sampleProduct?: ScannedProductResult) => {
    setSavedSuccess(false);
    setUseDemoMode(true);
    setIsScanning(true);
    setCapturedImage(null);
    setIsAnalyzing(true);

    const productToDetect = sampleProduct || SAMPLE_PRODUCTS[Math.floor(Math.random() * SAMPLE_PRODUCTS.length)];

    setTimeout(() => {
      setDetectedProduct(productToDetect);
      setEditName(productToDetect.name);
      setEditCategory(productToDetect.category);
      setEditExpiryDate(productToDetect.expiryDate);
      setEditPrice(productToDetect.price);
      setEditQuantity(productToDetect.quantity);
      setEditUnit(productToDetect.unit);
      setIsAnalyzing(false);
    }, 1200);
  };

  // Capture frame directly from live camera video feed and run real Tesseract OCR
  const handleCaptureVideoFrame = async () => {
    if (!videoRef.current) return;
    const frameDataUrl = captureFrameFromVideo(videoRef.current);
    if (!frameDataUrl) return;

    setCapturedImage(frameDataUrl);
    await runOCRAnalysisOnImage(frameDataUrl);
  };

  // Upload image file from gallery and run real Tesseract OCR
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedImage(dataUrl);
      setIsScanning(true);
      await runOCRAnalysisOnImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const runOCRAnalysisOnImage = async (imageDataUrl: string) => {
    setIsAnalyzing(true);
    setDetectedProduct(null);

    const ocrResult = await performRealImageOCR(imageDataUrl);

    setDetectedProduct(ocrResult);
    setEditName(ocrResult.name);
    setEditCategory(ocrResult.category);
    setEditExpiryDate(ocrResult.expiryDate);
    setEditPrice(ocrResult.price);
    setEditQuantity(ocrResult.quantity);
    setEditUnit(ocrResult.unit);
    setIsAnalyzing(false);
  };

  const handleSaveProduct = () => {
    if (!editName || !editExpiryDate) return;

    const newItem: FoodItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: editName,
      category: editCategory,
      expiryDate: editExpiryDate,
      addedDate: new Date().toISOString(),
      freshnessScore: 100,
      confidence: detectedProduct?.confidence || 95,
      price: Number(editPrice) || 0,
      quantity: Number(editQuantity) || 1,
      unit: editUnit || 'pcs',
    };

    // Save to store & schedule notifications
    store.addItem(newItem);
    notifyItemAddedWithExpiry(newItem);

    // Reset view
    setSavedSuccess(true);
    setIsScanning(false);
    setDetectedProduct(null);
    setCapturedImage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#86A789]/5 via-white to-gray-50 pb-24 select-none">
      <div className="max-w-md mx-auto">
        {/* Top Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">AI Expiry Scanner</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#86A789]" />
                Scan Expiry Date & Auto-Set Reminders
              </p>
            </div>
            <button
              onClick={() => requestNotificationPermission()}
              className="p-2.5 rounded-full bg-[#86A789]/10 text-[#86A789] hover:bg-[#86A789]/20 transition-all"
              title="Enable Push Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {savedSuccess && (
          <div className="mx-6 mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-900 text-sm">Product Saved to Pantry!</p>
              <p className="text-xs text-emerald-700 mt-0.5">Exact scanned expiry date stored & alert scheduled.</p>
            </div>
          </div>
        )}

        {/* Camera View / Preview Area */}
        <div className="px-6">
          <div className="relative aspect-[3/4] bg-gray-950 rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
            {isScanning ? (
              <>
                {capturedImage ? (
                  <img src={capturedImage} alt="Captured product" className="w-full h-full object-cover" />
                ) : useDemoMode ? (
                  <div className="w-full h-full relative flex items-center justify-center bg-gray-900">
                    <img
                      src="https://images.unsplash.com/photo-1632313911469-4b07c534ea16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwZXhwaXJhdGlvbiUyMGRhdGUlMjBsYWJlbHxlbnwxfHx8fDE3NzE5OTM3MDV8MA&ixlib=rb-4.1.0&q=80&w=1080"
                      alt="Expiry label sample"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Scanning Frame Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none">
                  <div className="w-64 h-48 border-2 border-white/60 rounded-2xl relative shadow-2xl backdrop-blur-[1px]">
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#86A789] rounded-tl-xl" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#86A789] rounded-tr-xl" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#86A789] rounded-bl-xl" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#86A789] rounded-br-xl" />

                    {/* Animated Scanning Beam */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#86A789] to-transparent animate-scan shadow-[0_0_15px_#86A789]" />

                    <div className="absolute inset-x-0 bottom-3 text-center">
                      <span className="text-[10px] font-semibold tracking-wider uppercase text-white bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        Align Product Expiry Date
                      </span>
                    </div>
                  </div>
                </div>

                {/* OCR Progress Overlay */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10 animate-in fade-in">
                    <div className="w-16 h-16 rounded-2xl bg-[#86A789]/20 border border-[#86A789]/40 flex items-center justify-center mb-4">
                      <RefreshCw className="w-8 h-8 text-[#86A789] animate-spin" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Analyzing Expiry Date...</h3>
                    <p className="text-xs text-gray-300 mt-1 max-w-xs leading-relaxed">
                      Reading expiry label date & details...
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-900 via-gray-850 to-gray-950 text-white text-center">
                <div className="w-20 h-20 rounded-3xl bg-[#86A789]/20 border border-[#86A789]/30 flex items-center justify-center mb-4 shadow-xl shadow-[#86A789]/10">
                  <Camera className="w-10 h-10 text-[#86A789]" />
                </div>
                <h2 className="text-xl font-bold">Expiry Date Scanner</h2>
                <p className="text-xs text-gray-400 mt-2 max-w-xs leading-relaxed">
                  Capture camera frame or upload product photo to extract expiry date and set automatic alerts.
                </p>
              </div>
            )}
          </div>

          {/* Hidden File Input for Image Upload */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Controls Bar */}
          {!detectedProduct && !isAnalyzing && (
            <div className="mt-5 space-y-3">
              {isScanning ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleCaptureVideoFrame}
                    className="flex-1 bg-[#86A789] text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-[#86A789]/20 hover:bg-[#729275] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <ScanLine className="w-5 h-5" />
                    Scan Product Date
                  </button>
                  <button
                    onClick={() => setIsScanning(false)}
                    className="px-5 bg-gray-200 text-gray-800 rounded-2xl font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleStartScan}
                    className="bg-[#86A789] text-white py-3.5 px-4 rounded-2xl font-bold shadow-lg shadow-[#86A789]/20 hover:bg-[#729275] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Live Camera
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white text-gray-800 border-2 border-gray-200 py-3.5 px-4 rounded-2xl font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4 text-gray-600" />
                    Upload Photo
                  </button>
                </div>
              )}

              {/* Sample Preset Selector */}
              {!isScanning && (
                <div className="pt-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 text-center">
                    Or Try Sample Items
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {SAMPLE_PRODUCTS.map((prod, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleDemoScan(prod)}
                        className="whitespace-nowrap px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 hover:border-[#86A789] hover:text-[#86A789] transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <span>{prod.category === 'dairy' ? '🥛' : prod.category === 'meat' ? '🥩' : prod.category === 'vegetables' ? '🥬' : '🍞'}</span>
                        <span>{prod.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scanned Expiry Date Review & Edit Card */}
        {detectedProduct && !isAnalyzing && (
          <div className="mt-6 px-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#86A789]/10 px-4 py-1.5 rounded-bl-2xl text-xs font-bold text-[#86A789] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{detectedProduct.confidence}% Scanned Match</span>
              </div>

              <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                <span>Product Details</span>
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Confirm your scanned item & expiry date before adding to pantry.
              </p>

              <div className="space-y-4">
                {/* Product Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#86A789] text-sm font-semibold"
                    placeholder="Item Name"
                  />
                </div>

                {/* Expiry Date Picker */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#86A789]" />
                      Scanned Expiry Date
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Auto Detected
                    </span>
                  </label>
                  <input
                    type="date"
                    value={editExpiryDate}
                    onChange={(e) => setEditExpiryDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#86A789] focus:outline-none focus:ring-2 focus:ring-[#86A789] text-sm font-bold text-gray-900 bg-[#86A789]/5"
                  />
                </div>

                {/* Category & Quantity Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                      Category
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as FoodItem['category'])}
                      className="w-full px-3 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#86A789] text-xs font-medium bg-white"
                    >
                      <option value="dairy">🥛 Dairy</option>
                      <option value="meat">🥩 Meat & Fish</option>
                      <option value="vegetables">🥬 Vegetables</option>
                      <option value="pantry">🍞 Pantry</option>
                      <option value="canned">🥫 Canned</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                      Quantity & Unit
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min="1"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(Number(e.target.value))}
                        className="w-16 px-2 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#86A789] text-xs font-semibold text-center"
                      />
                      <input
                        type="text"
                        value={editUnit}
                        onChange={(e) => setEditUnit(e.target.value)}
                        className="flex-1 px-3 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#86A789] text-xs font-semibold"
                        placeholder="L, kg, pcs"
                      />
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#86A789] text-sm font-semibold"
                    placeholder="₹ Price"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  onClick={handleSaveProduct}
                  className="w-full bg-[#86A789] text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-[#86A789]/20 hover:bg-[#729275] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Bell className="w-4 h-4" />
                  Save Scanned Product & Schedule Alert
                </button>

                <button
                  onClick={() => {
                    setDetectedProduct(null);
                    setCapturedImage(null);
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-2xl font-semibold hover:bg-gray-200 transition-colors text-xs"
                >
                  Scan Another Product
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: 100%; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}