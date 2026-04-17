import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Scan, 
  RotateCcw,
  QrCode
} from 'lucide-react';
import { QRScanner } from '@/components/qr/QRScanner';
import { verifyGuest, type VerificationResult } from '@/api/guests';
import { parseTokenFromUrl } from '@/utils/qr';

export function Verify() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  
  const [scanning, setScanning] = useState(!token);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (token) {
      const parsedToken = parseTokenFromUrl(token) || token;
      handleVerify(parsedToken);
    }
  }, [token]);

  const handleVerify = async (qrToken: string) => {
    setVerifying(true);

    try {
      const verificationResult = await verifyGuest(qrToken);
      setResult(verificationResult);
    } catch (err) {
      setResult({
        success: false,
        message: (err as Error)?.message || 'Unable to verify this pass.',
      });
    } finally {
      setScanning(false);
      setVerifying(false);
    }
  };

  const handleScan = (data: string) => {
    const parsedToken = parseTokenFromUrl(data) || data;
    handleVerify(parsedToken);
  };

  const handleReset = () => {
    setResult(null);
    setScanning(true);
  };

  // Verifying state
  if (verifying) {
    return (
      <div className="min-h-screen bg-[#070A12] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-[#00F0FF]/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Scan className="w-10 h-10 text-[#00F0FF]" />
          </div>
          <h2 className="text-2xl font-bold text-[#F4F7FF] mb-2">Verifying...</h2>
          <p className="text-[#A7B1C6]">Please wait while we check this pass</p>
        </div>
      </div>
    );
  }

  // Scanner view
  if (scanning) {
    return (
      <div className="min-h-screen bg-[#070A12] py-8 px-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#00F0FF]/10 flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-[#00F0FF]" />
            </div>
            <h1 className="text-2xl font-bold text-[#F4F7FF] mb-2">Gatekeeper</h1>
            <p className="text-[#A7B1C6]">Scan guest QR codes to verify entry</p>
          </div>

          {/* Scanner */}
          <Card className="bg-[#0B1020] border-[#A7B1C6]/10">
            <CardContent className="p-6">
              <QRScanner onScan={handleScan} onError={(err) => console.error(err)} />
            </CardContent>
          </Card>

          {/* Instructions */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[#A7B1C6]/70">
              Point your camera at a guest&apos;s QR code to verify their pass
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Result view
  return (
    <div className="min-h-screen bg-[#070A12] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {result && (
          <Card className={`bg-[#0B1020] border-2 overflow-hidden ${
            result.success 
              ? 'border-[#00F0FF]/30' 
              : result.guest?.status === 'used'
              ? 'border-[#A7B1C6]/30'
              : 'border-red-500/30'
          }`}>
            <CardContent className="p-8 text-center">
              {/* Status Icon */}
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
                result.success 
                  ? 'bg-[#00F0FF]/10' 
                  : result.guest?.status === 'used'
                  ? 'bg-[#A7B1C6]/10'
                  : 'bg-red-500/10'
              }`}>
                {result.success ? (
                  <CheckCircle className="w-12 h-12 text-[#00F0FF]" />
                ) : result.guest?.status === 'used' ? (
                  <AlertCircle className="w-12 h-12 text-[#A7B1C6]" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-400" />
                )}
              </div>

              {/* Status Title */}
              <h2 className={`text-3xl font-bold mb-2 ${
                result.success 
                  ? 'text-[#00F0FF]' 
                  : result.guest?.status === 'used'
                  ? 'text-[#A7B1C6]'
                  : 'text-red-400'
              }`}>
                {result.success ? 'Verified' : result.guest?.status === 'used' ? 'Already Used' : 'Invalid Pass'}
              </h2>

              {/* Guest Info */}
              {result.guest && (
                <div className="mb-6">
                  <p className="text-xl font-semibold text-[#F4F7FF] mb-1">
                    {result.guest.name}
                  </p>
                  <p className="text-[#A7B1C6]">{result.eventName}</p>
                  
                  {/* Entry Info */}
                  {result.entriesAllowed && (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#070A12]">
                      <span className="text-sm text-[#A7B1C6]">Entries:</span>
                      <span className="text-sm font-semibold text-[#F4F7FF]">
                        {result.entriesUsed} / {result.entriesAllowed}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Message */}
              <p className="text-[#A7B1C6] mb-8">{result.message}</p>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={handleReset}
                  className={`w-full font-semibold ${
                    result.success
                      ? 'bg-[#00F0FF] text-[#070A12] hover:bg-[#00F0FF]/90'
                      : 'bg-[#A7B1C6]/10 text-[#F4F7FF] hover:bg-[#A7B1C6]/20'
                  }`}
                >
                  {result.success ? (
                    <>
                      <Scan className="w-4 h-4 mr-2" />
                      Scan Next
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Try Again
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="w-full border-[#A7B1C6]/20 text-[#F4F7FF] hover:bg-[#A7B1C6]/10"
                >
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-[#A7B1C6]/70 mt-6">
          Gate-Pass Verification System
        </p>
      </div>
    </div>
  );
}
