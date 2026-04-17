import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Search,
  Copy,
  Check,
  QrCode
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getEventById, getEventStats, type Event } from '@/api/events';
import { 
  getGuestsByEvent, 
  getEntryLogs, 
  revokeGuestPass, 
  restoreGuestPass,
  type Guest,
  type EntryLog,
} from '@/api/guests';
import { generateVerificationUrl } from '@/utils/qr';
import { QRDisplay } from '@/components/qr/QRDisplay';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GuestWithStatus extends Guest {
  entryTime?: string;
}

export function EventDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, isLoggedIn } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<{
    totalGuests: number;
    checkedIn: number;
    validPasses: number;
    usedPasses: number;
    revokedPasses: number;
  } | null>(null);
  const [guests, setGuests] = useState<GuestWithStatus[]>([]);
  const [logs, setLogs] = useState<EntryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'used' | 'revoked'>('all');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadEventData = useCallback(async () => {
    if (!id) return;

    const eventData = await getEventById(id);
    if (!eventData) {
      navigate('/dashboard');
      return;
    }

    if (eventData.host_id !== user?.id) {
      navigate('/dashboard');
      return;
    }

    setEvent(eventData);
    setStats(await getEventStats(id));

    const guestsData = await getGuestsByEvent(id);
    const logsData = await getEntryLogs(id);

    const guestsWithStatus = guestsData.map((guest) => {
      const guestLogs = logsData.filter((log) => log.guest_id === guest.id);
      const firstEntry = guestLogs.length > 0 ? guestLogs[0].scanned_at : null;
      return {
        ...guest,
        entryTime: firstEntry ? new Date(firstEntry).toLocaleString() : undefined,
      };
    });

    setGuests(guestsWithStatus);
    setLogs(logsData);
    setLoading(false);
  }, [id, navigate, user]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadEventData();
    }
  }, [id, isLoggedIn, navigate, loadEventData]);

  const handleRevoke = async (guestId: string) => {
    if (confirm('Are you sure you want to revoke this pass?')) {
      await revokeGuestPass(guestId);
      loadEventData();
    }
  };

  const handleRestore = async (guestId: string) => {
    await restoreGuestPass(guestId);
    loadEventData();
  };

  const handleShowGuestQR = (guest: Guest) => {
    setSelectedGuest(guest);
    setShowQRDialog(true);
  };

  const handleCopyLink = () => {
    if (!event) return;
    const link = `${window.location.origin}/register/${event.id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(event.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (guest.email && guest.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || guest.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (timestamp: number | string) => {
    const num = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
    return new Date(num).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: number | string) => {
    const num = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
    return new Date(num).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || !event) {
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-[#A7B1C6] hover:text-[#F4F7FF] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-xl font-bold text-[#F4F7FF] truncate">{event.name}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Event Info Card */}
        <Card className="bg-[#0B1020] border-[#A7B1C6]/10 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
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
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#00F0FF]/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-[#00F0FF]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#A7B1C6]">Date & Time</p>
                      <p className="text-[#F4F7FF]">{formatDate(event.date)} at {formatTime(event.date)}</p>
                    </div>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#00F0FF]/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-[#00F0FF]" />
                      </div>
                      <div>
                        <p className="text-sm text-[#A7B1C6]">Location</p>
                        <p className="text-[#F4F7FF]">{event.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                  className="border-[#A7B1C6]/20 text-[#F4F7FF] hover:bg-[#A7B1C6]/10"
                >
                  {copiedId === event.id ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-[#00F0FF]" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#0B1020] border-[#A7B1C6]/10">
            <CardContent className="p-4 text-center">
              <Users className="w-5 h-5 text-[#A7B1C6] mx-auto mb-2" />
              <p className="text-2xl font-bold text-[#F4F7FF]">{stats?.totalGuests || 0}</p>
              <p className="text-xs text-[#A7B1C6]">Registered</p>
            </CardContent>
          </Card>
          <Card className="bg-[#0B1020] border-[#A7B1C6]/10">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-5 h-5 text-[#00F0FF] mx-auto mb-2" />
              <p className="text-2xl font-bold text-[#00F0FF]">{stats?.checkedIn || 0}</p>
              <p className="text-xs text-[#A7B1C6]">Checked In</p>
            </CardContent>
          </Card>
          <Card className="bg-[#0B1020] border-[#A7B1C6]/10">
            <CardContent className="p-4 text-center">
              <QrCode className="w-5 h-5 text-[#A7B1C6] mx-auto mb-2" />
              <p className="text-2xl font-bold text-[#F4F7FF]">{stats?.validPasses || 0}</p>
              <p className="text-xs text-[#A7B1C6]">Valid Passes</p>
            </CardContent>
          </Card>
          <Card className="bg-[#0B1020] border-[#A7B1C6]/10">
            <CardContent className="p-4 text-center">
              <XCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-400">{stats?.revokedPasses || 0}</p>
              <p className="text-xs text-[#A7B1C6]">Revoked</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="guests" className="space-y-6">
          <TabsList className="bg-[#0B1020] border border-[#A7B1C6]/10">
            <TabsTrigger value="guests" className="data-[state=active]:bg-[#00F0FF] data-[state=active]:text-[#070A12]">
              Guest List
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-[#00F0FF] data-[state=active]:text-[#070A12]">
              Activity Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guests">
            <Card className="bg-[#0B1020] border-[#A7B1C6]/10">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-[#F4F7FF]">Guests</CardTitle>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A7B1C6]" />
                      <Input
                        type="text"
                        placeholder="Search guests..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#070A12] border-[#A7B1C6]/20 text-[#F4F7FF] placeholder:text-[#A7B1C6]/50 pl-10 w-full sm:w-64"
                      />
                    </div>
                    
                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as 'all' | 'valid' | 'used' | 'revoked')}
                      className="bg-[#070A12] border border-[#A7B1C6]/20 text-[#F4F7FF] rounded-md px-3 py-2 text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="valid">Valid</option>
                      <option value="used">Used</option>
                      <option value="revoked">Revoked</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {filteredGuests.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-[#A7B1C6]/50 mx-auto mb-4" />
                    <p className="text-[#A7B1C6]">No guests found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#A7B1C6]/10">
                          <th className="text-left py-3 px-4 text-[#A7B1C6] font-medium">Name</th>
                          <th className="text-left py-3 px-4 text-[#A7B1C6] font-medium">Email</th>
                          <th className="text-left py-3 px-4 text-[#A7B1C6] font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-[#A7B1C6] font-medium">Entries</th>
                          <th className="text-left py-3 px-4 text-[#A7B1C6] font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredGuests.map((guest) => (
                          <tr key={guest.id} className="border-b border-[#A7B1C6]/5 hover:bg-[#070A12]/50">
                            <td className="py-3 px-4 text-[#F4F7FF]">{guest.name}</td>
                            <td className="py-3 px-4 text-[#A7B1C6]">{guest.email || '-'}</td>
                            <td className="py-3 px-4">
                              <Badge 
                                variant={guest.status === 'valid' ? 'default' : guest.status === 'used' ? 'secondary' : 'destructive'}
                                className={guest.status === 'valid' 
                                  ? 'bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/30' 
                                  : guest.status === 'used'
                                  ? 'bg-[#A7B1C6]/10 text-[#A7B1C6] border-[#A7B1C6]/30'
                                  : 'bg-red-500/10 text-red-400 border-red-500/30'
                                }
                              >
                                {guest.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-[#A7B1C6]">
                              {guest.entries_used} / {1 + guest.plus_one_count}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleShowGuestQR(guest)}
                                  className="text-[#A7B1C6] hover:text-[#00F0FF] hover:bg-[#00F0FF]/10"
                                >
                                  <QrCode className="w-4 h-4" />
                                </Button>
                                
                                {guest.status === 'revoked' ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRestore(guest.id)}
                                    className="text-[#A7B1C6] hover:text-[#00F0FF] hover:bg-[#00F0FF]/10"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRevoke(guest.id)}
                                    className="text-[#A7B1C6] hover:text-red-400 hover:bg-red-500/10"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="bg-[#0B1020] border-[#A7B1C6]/10">
              <CardHeader>
                <CardTitle className="text-[#F4F7FF]">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-[#A7B1C6]/50 mx-auto mb-4" />
                    <p className="text-[#A7B1C6]">No activity yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div 
                        key={log.id} 
                        className="flex items-center justify-between p-4 rounded-lg bg-[#070A12] border border-[#A7B1C6]/5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#00F0FF]/10 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-[#00F0FF]" />
                          </div>
                          <div>
                            <p className="text-[#F4F7FF] font-medium">{log.guest_name}</p>
                            <p className="text-sm text-[#A7B1C6]">{log.guest_email || 'No email'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[#F4F7FF]">{new Date(log.scanned_at).toLocaleTimeString()}</p>
                          <p className="text-sm text-[#A7B1C6]">{new Date(log.scanned_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Guest QR Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="bg-[#0B1020] border-[#A7B1C6]/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#F4F7FF]">Guest QR Code</DialogTitle>
          </DialogHeader>
          
          {selectedGuest && (
            <div className="py-6">
              <div className="text-center mb-6">
                <p className="text-[#F4F7FF] font-semibold text-lg">{selectedGuest.name}</p>
                <p className="text-[#A7B1C6]">{event?.name}</p>
                <Badge 
                  variant={selectedGuest.status === 'valid' ? 'default' : selectedGuest.status === 'used' ? 'secondary' : 'destructive'}
                  className={`mt-2 ${selectedGuest.status === 'valid' 
                    ? 'bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/30' 
                    : selectedGuest.status === 'used'
                    ? 'bg-[#A7B1C6]/10 text-[#A7B1C6] border-[#A7B1C6]/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}
                >
                  {selectedGuest.status}
                </Badge>
              </div>
              
              <QRDisplay 
                data={generateVerificationUrl(selectedGuest.qr_token)}
                size={280}
                className="mx-auto"
              />
              
              <p className="text-center text-xs text-[#A7B1C6]/70 mt-6">
                This is the guest&apos;s unique QR code for check-in.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
