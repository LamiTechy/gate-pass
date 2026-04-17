import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManual, setShowManual] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check for camera availability
  useEffect(() => {
    const checkCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideoDevice = devices.some(device => device.kind === 'videoinput');
        setHasCamera(hasVideoDevice);
      } catch {
        setHasCamera(false);
      }
    };
    
    checkCamera();
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsScanning(true);
    } catch (err) {
      console.error('Camera error:', err);
      onError?.('Could not access camera. Please use manual entry.');
      setHasCamera(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Handle manual submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (showManual || hasCamera === false) {
    return (
      <div className="flex flex-col items-center gap-6 p-6">
        <div className="text-center">
          <Keyboard className="w-12 h-12 text-[#00F0FF] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#F4F7FF] mb-2">Enter Code Manually</h3>
          <p className="text-sm text-[#A7B1C6]">Type the verification code from the guest&apos;s pass</p>
        </div>
        
        <form onSubmit={handleManualSubmit} className="w-full max-w-sm space-y-4">
          <Input
            type="text"
            placeholder="Enter verification code..."
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            className="bg-[#0B1020] border-[#A7B1C6]/20 text-[#F4F7FF] placeholder:text-[#A7B1C6]/50"
          />
          <Button
            type="submit"
            className="w-full bg-[#00F0FF] text-[#070A12] hover:bg-[#00F0FF]/90"
          >
            Verify Code
          </Button>
        </form>
        
        {hasCamera !== false && (
          <button
            onClick={() => setShowManual(false)}
            className="text-sm text-[#A7B1C6] hover:text-[#F4F7FF] transition-colors"
          >
            Back to scanner
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Camera Preview */}
      <div className="relative w-full max-w-md aspect-square bg-[#0B1020] rounded-2xl overflow-hidden">
        {isScanning ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Scan overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Dark overlay corners */}
              <div className="absolute inset-0 bg-[#070A12]/40" />
              
              {/* Clear scan area */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-64 h-64">
                  {/* Scan frame */}
                  <div className="absolute inset-0 border-2 border-[#00F0FF]/50 rounded-lg" />
                  
                  {/* Corner brackets */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-[#00F0FF]" />
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-[#00F0FF]" />
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-[#00F0FF]" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-[#00F0FF]" />
                  
                  {/* Scan line animation */}
                  <div className="absolute left-0 right-0 h-0.5 bg-[#00F0FF] animate-scan-line" />
                </div>
              </div>
            </div>
            
            {/* Close button */}
            <button
              onClick={stopCamera}
              className="absolute top-4 right-4 p-2 bg-[#070A12]/80 rounded-full text-[#F4F7FF] hover:bg-[#070A12]"
            >
              <X className="w-5 h-5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Camera className="w-16 h-16 text-[#A7B1C6]" />
            <p className="text-[#A7B1C6] text-center px-8">
              Camera access is needed to scan QR codes
            </p>
            <Button
              onClick={startCamera}
              className="bg-[#00F0FF] text-[#070A12] hover:bg-[#00F0FF]/90"
            >
              Enable Camera
            </Button>
          </div>
        )}
      </div>
      
      {/* Instructions */}
      <div className="text-center">
        <p className="text-[#F4F7FF] font-medium mb-2">Point camera at a guest&apos;s QR code</p>
        <button
          onClick={() => setShowManual(true)}
          className="text-sm text-[#A7B1C6] hover:text-[#00F0FF] transition-colors"
        >
          Can&apos;t scan? Enter code manually
        </button>
      </div>
    </div>
  );
}
