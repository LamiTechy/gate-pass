import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, MapPin, Users, Loader2, CheckCircle, ArrowRight, QrCode } from 'lucide-react';
import { getEventById, type Event } from '@/api/events';
import { registerGuest, type Guest } from '@/api/guests';
import { generateVerificationUrl } from '@/utils/qr';
import { QRDisplay } from '@/components/qr/QRDisplay';

export function GuestRegistration() {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [guest, setGuest] = useState<Guest | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [plusOneCount, setPlusOneCount] = useState(0);
  const [error, setError] = useState('');

  const loadEvent = useCallback(async () => {
    if (!eventId) return;

    const eventData = await getEventById(eventId);
    if (!eventData || !eventData.registration_open) {
      setEvent(eventData);
      setLoading(false);
      return;
    }

    setEvent(eventData);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      void loadEvent();
    }
  }, [eventId, loadEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!eventId) return;

    setRegistering(true);

    try {
      const result = await registerGuest(eventId, {
        name: name.trim(),
        email: email.trim() || undefined,
        plus_one_count: plusOneCount,
      });

      if (result?.guest) {
        setGuest(result.guest);
        setRegistered(true);
      } else {
        setError('Registration failed. The event may be full or plus-ones may not be allowed.');
      }
    } catch (err) {
      setError((err as Error)?.message || 'An error occurred. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  const formatDate = (timestamp: number | string) => {
    const num = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
    return new Date(num).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A12] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00F0FF]" />
      </div>
    );
  }

  // Event not found
  if (!event) {
    return (
      <div className="min-h-screen bg-[#070A12] flex items-center justify-center p-6">
        <Card className="bg-[#0B1020] border-[#A7B1C6]/10 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <QrCode className="w-16 h-16 text-[#A7B1C6]/50 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-[#F4F7FF] mb-2">Event Not Found</h1>
            <p className="text-[#A7B1C6] mb-6">This event doesn&apos;t exist or has been removed.</p>
            <Button
              onClick={() => navigate('/')}
              className="bg-[#00F0FF] text-[#070A12] hover:bg-[#00F0FF]/90"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Registration closed
  if (!event.registration_open) {
    return (
      <div className="min-h-screen bg-[#070A12] flex items-center justify-center p-6">
        <Card className="bg-[#0B1020] border-[#A7B1C6]/10 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#A7B1C6]/10 flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-[#A7B1C6]" />
            </div>
            <h1 className="text-2xl font-bold text-[#F4F7FF] mb-2">Registration Closed</h1>
            <p className="text-[#A7B1C6] mb-6">
              Registration for &quot;{event.name}&quot; is currently closed.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-[#00F0FF] text-[#070A12] hover:bg-[#00F0FF]/90"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state - show QR pass
  if (registered && guest) {
    return (
      <div className="min-h-screen bg-[#070A12] py-12 px-4">
        <div className="max-w-md mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-[#00F0FF]/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-[#00F0FF]" />
            </div>
            <h1 className="text-3xl font-bold text-[#F4F7FF] mb-2">You&apos;re In!</h1>
            <p className="text-[#A7B1C6]">Show this QR code at the door</p>
          </div>

          {/* VIP Pass Card */}
          <Card className="bg-gradient-to-b from-[#0B1020] to-[#070A12] border-2 border-[#00F0FF]/30 overflow-hidden relative">
            {/* Glow effect */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full opacity-20"
              style={{
                background: 'radial-gradient(circle, rgba(0,240,255,0.3) 0%, transparent 70%)',
                filter: 'blur(60px)'
              }}
            />
            
            <CardContent className="p-8 relative z-10">
              {/* Admit One */}
              <div className="text-center mb-6">
                <span className="inline-block px-4 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-xs font-mono tracking-widest text-[#00F0FF]">
                  ADMIT ONE
                </span>
              </div>

              {/* Event Info */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[#F4F7FF] mb-2">{event.name}</h2>
                <div className="flex items-center justify-center gap-2 text-[#A7B1C6] text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(event.date)}</span>
                </div>
                {event.location && (
                  <div className="flex items-center justify-center gap-2 text-[#A7B1C6] text-sm mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#00F0FF]/30 to-transparent" />
              </div>

              {/* Guest Info */}
              <div className="text-center mb-8">
                <p className="text-sm text-[#A7B1C6] mb-1">Guest</p>
                <p className="text-xl font-semibold text-[#F4F7FF]">{guest.name}</p>
                {guest.email && (
                  <p className="text-sm text-[#A7B1C6] mt-1">{guest.email}</p>
                )}
                {guest.plus_one_count > 0 && (
                  <p className="text-sm text-[#00F0FF] mt-2">
                    + {guest.plus_one_count} guest{guest.plus_one_count > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-6">
                <QRDisplay 
                  data={generateVerificationUrl(guest.qr_token)}
                  size={240}
                  showDownload={true}
                />
              </div>

              {/* Footer */}
              <p className="text-center text-xs text-[#A7B1C6]/70">
                Show this at the door for entry
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="mt-8 text-center">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="border-[#A7B1C6]/20 text-[#F4F7FF] hover:bg-[#A7B1C6]/10"
            >
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Registration Form
  return (
    <div className="min-h-screen bg-[#070A12] py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Event Badge */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-sm text-[#00F0FF]">
            <Calendar className="w-4 h-4" />
            {event.name} • {formatDate(event.date)}
          </span>
        </div>

        {/* Registration Card */}
        <Card className="bg-[#0B1020] border-[#A7B1C6]/10">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[#F4F7FF] mb-2">Get your pass</h1>
              <p className="text-[#A7B1C6]">Enter your details. We&apos;ll generate your QR code instantly.</p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/30">
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#F4F7FF]">
                  Full Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-[#070A12] border-[#A7B1C6]/20 text-[#F4F7FF] placeholder:text-[#A7B1C6]/50 focus:border-[#00F0FF] focus:ring-[#00F0FF]/20"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#F4F7FF]">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#070A12] border-[#A7B1C6]/20 text-[#F4F7FF] placeholder:text-[#A7B1C6]/50 focus:border-[#00F0FF] focus:ring-[#00F0FF]/20"
                />
                <p className="text-xs text-[#A7B1C6]/70">We only email your pass. No spam.</p>
              </div>

              {/* Plus One */}
              {event.allow_plus_one && event.plus_one_limit > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="plusOne" className="text-[#F4F7FF]">Plus Ones</Label>
                  <select
                    id="plusOne"
                    value={plusOneCount}
                    onChange={(e) => setPlusOneCount(parseInt(e.target.value))}
                    className="w-full bg-[#070A12] border border-[#A7B1C6]/20 text-[#F4F7FF] rounded-md px-3 py-2 focus:border-[#00F0FF] focus:ring-[#00F0FF]/20"
                  >
                    <option value={0}>Just me</option>
                    {Array.from({ length: event.plus_one_limit }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        + {i + 1} guest{i + 1 > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={registering}
                className="w-full bg-[#00F0FF] text-[#070A12] hover:bg-[#00F0FF]/90 font-semibold py-6"
              >
                {registering ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Pass...
                  </>
                ) : (
                  <>
                    Generate My Pass
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-[#A7B1C6]/70 mt-6">
          Powered by Gate-Pass
        </p>
      </div>
    </div>
  );
}
