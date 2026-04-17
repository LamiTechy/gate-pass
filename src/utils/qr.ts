import QRCode from 'qrcode';

// Generate QR code as data URL
export async function generateQRCode(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#070A12',
        light: '#F4F7FF'
      },
      errorCorrectionLevel: 'H'
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

// Generate QR code with custom styling
export async function generateStyledQRCode(data: string, darkColor: string = '#070A12'): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 400,
      margin: 3,
      color: {
        dark: darkColor,
        light: '#F4F7FF'
      },
      errorCorrectionLevel: 'H'
    });
  } catch (error) {
    console.error('Error generating styled QR code:', error);
    throw error;
  }
}

// Generate verification URL for QR code
export function generateVerificationUrl(token: string, baseUrl: string = window.location.origin): string {
  return `${baseUrl}/verify/${token}`;
}

// Parse QR token from URL
export function parseTokenFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const tokenIndex = pathParts.indexOf('verify') + 1;
    return pathParts[tokenIndex] || null;
  } catch {
    return null;
  }
}
