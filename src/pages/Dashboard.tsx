import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Calendar, 
  Users, 
  CheckCircle, 
  QrCode, 
  MoreVertical,
  LogOut,
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { getEventsByHost, getEventStats, type Event, deleteEvent, toggleRegistration } from '@/api/events';
import { logout } from '@/utils/auth';
import { QRDisplay } from '@/components/qr/QRDisplay';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EventWithStats extends Event {
  stats: {
    totalGuests: number;
    checkedIn: number;
    validPasses: number;
    usedPasses: number;
    revokedPasses: number;
  };
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout: authLogout } = useAuth();
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventWithStats | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    if (!user) return;

    const hostEvents = await getEventsByHost();
    const eventsWithStats = await Promise.all(
      hostEvents.map(async (event) => ({
        ...event,
        stats: await getEventStats(event.id),
      }))
    );

    setEvents(eventsWithStats);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEvents();
  }, [isLoggedIn, navigate, loadEvents]);

  const handleLogout = () => {
    logout();
    authLogout();
    navigate('/');
  };

  const handleCopyLink = (eventId: string) => {
    const link = `${window.location.origin}/register/${eventId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(eventId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleRegistration = async (eventId: string, currentStatus: boolean) => {
    await toggleRegistration(eventId, !currentStatus);
    loadEvents();
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      await deleteEvent(eventId);
      loadEvents();
    }
  };

  const handleShowQR = (event: EventWithStats) => {
    setSelectedEvent(event);
    setShowQRDialog(true);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A12] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00F0FF]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A12]">
      {/* Header */}
      <header className="border-b border-[#A7B1C6]/10 bg-[#070A12]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/10 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-[#00F0FF]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#F4F7FF]">Gate-Pass</h1>
                <p className="text-xs text-[#A7B1C6]">Host Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#A7B1C6] hidden sm:inline">
                {user?.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-[#A7B1C6] hover:text-[#F4F7FF] hover:bg-[#A7B1C6]/10"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#F4F7FF]">Your Events</h2>
            <p className="text-[#A7B1C6]">Manage your events and track guest check-ins</p>
          </div>
          
          <Button
            onClick={() => navigate('/create-event')}
            className="bg-[#00F0FF] text-[#070A12] hover:bg-[#00F0FF]/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <Card className="bg-[#0B1020] border-[#A7B1C6]/10">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#00F0FF]/10 flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-8 h-8 text-[#00F0FF]" />
              </div>
              <h3 className="text-xl font-semibold text-[#F4F7FF] mb-2">No events yet</h3>
              <p className="text-[#A7B1C6] mb-6 max-w-md mx-auto">
                Create your first event to start inviting guests and tracking check-ins.
              </p>
              <Button
                onClick={() => navigate('/create-event')}
                className="bg-[#00F0FF] text-[#070A12] hover:bg-[#00F0FF]/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card 
                key={event.id} 
                className="bg-[#0B1020] border-[#A7B1C6]/10 hover:border-[#00F0FF]/30 transition-colors group"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold text-[#F4F7FF] truncate">
                        {event.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="w-4 h-4 text-[#A7B1C6]" />
                        <span className="text-sm text-[#A7B1C6]">{formatDate(event.date)}</span>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-[#A7B1C6] hover:text-[#F4F7FF] hover:bg-[#A7B1C6]/10"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0B1020] border-[#A7B1C6]/20">
                        <DropdownMenuItem 
                          onClick={() => navigate(`/event/${event.id}`)}
                          className="text-[#F4F7FF] hover:bg-[#A7B1C6]/10 cursor-pointer"
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleToggleRegistration(event.id, event.registration_open)}
                          className="text-[#F4F7FF] hover:bg-[#A7B1C6]/10 cursor-pointer"
                        >
                          {event.registration_open ? 'Close Registration' : 'Open Registration'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                        >
                          Delete Event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <Badge 
                      variant={event.registration_open ? 'default' : 'secondary'}
                      className={event.registration_open 
                        ? 'bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/30' 
                        : 'bg-[#A7B1C6]/10 text-[#A7B1C6] border-[#A7B1C6]/30'
                      }
                    >
                      {event.registration_open ? 'Registration Open' : 'Registration Closed'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 rounded-lg bg-[#070A12]">
                      <Users className="w-4 h-4 text-[#A7B1C6] mx-auto mb-1" />
                      <p className="text-lg font-bold text-[#F4F7FF]">{event.stats.totalGuests}</p>
                      <p className="text-xs text-[#A7B1C6]">Registered</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-[#070A12]">
                      <CheckCircle className="w-4 h-4 text-[#00F0FF] mx-auto mb-1" />
                      <p className="text-lg font-bold text-[#00F0FF]">{event.stats.checkedIn}</p>
                      <p className="text-xs text-[#A7B1C6]">Checked In</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-[#070A12]">
                      <QrCode className="w-4 h-4 text-[#A7B1C6] mx-auto mb-1" />
                      <p className="text-lg font-bold text-[#F4F7FF]">{event.stats.validPasses}</p>
                      <p className="text-xs text-[#A7B1C6]">Valid</p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full border-[#A7B1C6]/20 text-[#F4F7FF] hover:bg-[#A7B1C6]/10"
                      onClick={() => handleCopyLink(event.id)}
                    >
                      {copiedId === event.id ? (
                        <>
                          <Check className="w-4 h-4 mr-2 text-[#00F0FF]" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Registration Link
                        </>
                      )}
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-[#A7B1C6]/20 text-[#F4F7FF] hover:bg-[#A7B1C6]/10"
                        onClick={() => handleShowQR(event)}
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        Master QR
                      </Button>
                      <Button
                        className="flex-1 bg-[#00F0FF] text-[#070A12] hover:bg-[#00F0FF]/90"
                        onClick={() => navigate(`/event/${event.id}`)}
                      >
                        Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Master QR Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="bg-[#0B1020] border-[#A7B1C6]/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#F4F7FF]">Master QR Code</DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="py-6">
              <p className="text-center text-[#A7B1C6] mb-6">
                Scan to open registration for<br />
                <span className="text-[#F4F7FF] font-semibold">{selectedEvent.name}</span>
              </p>
              
              <QRDisplay 
                data={`${window.location.origin}/register/${selectedEvent.id}`}
                size={280}
                className="mx-auto"
              />
              
              <p className="text-center text-xs text-[#A7B1C6]/70 mt-6">
                This QR code links to the registration page for your event.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
