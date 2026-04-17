import { useState, useEffect } from 'react';
import { generateQRCode } from '@/utils/qr';
import { Loader2 } from 'lucide-react';

interface QRDisplayProps {
  data: string;
  size?: number;
  className?: string;
  showDownload?: boolean;
}

export function QRDisplay({ data, size = 300, className = '', showDownload = true }: QRDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const generateQR = async () => {
      try {
        setLoading(true);
        setError('');
        const dataUrl = await generateQRCode(data);
        setQrDataUrl(dataUrl);
      } catch (err) {
        setError('Failed to generate QR code');
        console.error('QR generation error:', err);
      } finally {
        setLoading(false);
      }
    };

    generateQR();
  }, [data]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `gatepass-qr-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <Loader2 className="w-8 h-8 animate-spin text-[#00F0FF]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-[#0B1020] rounded-xl ${className}`} style={{ width: size, height: size }}>
        <p className="text-red-400 text-sm text-center px-4">{error}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div 
        className="relative bg-white p-4 rounded-xl shadow-lg"
        style={{ 
          boxShadow: '0 0 30px rgba(0, 240, 255, 0.18)'
        }}
      >
        <img 
          src={qrDataUrl} 
          alt="QR Code" 
          className="rounded-lg"
          style={{ width: size - 32, height: size - 32 }}
        />
        
        {/* Scan frame corners */}
        <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-[#00F0FF]" />
        <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-[#00F0FF]" />
        <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-[#00F0FF]" />
        <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-[#00F0FF]" />
      </div>
      
      {showDownload && (
        <button
          onClick={handleDownload}
          className="text-sm text-[#00F0FF] hover:text-[#00F0FF]/80 transition-colors underline"
        >
          Download QR Code
        </button>
      )}
    </div>
  );
}
