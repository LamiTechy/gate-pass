import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Calendar, Loader2, MapPin, Users, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createEvent } from '@/api/events';

export function CreateEvent() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [maxGuests, setMaxGuests] = useState('');
  const [allowPlusOne, setAllowPlusOne] = useState(false);
  const [plusOneLimit, setPlusOneLimit] = useState('1');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Event name is required');
      return;
    }

    if (!date || !time) {
      setError('Date and time are required');
      return;
    }

    if (!user) {
      setError('You must be logged in to create an event');
      return;
    }

    setLoading(true);

    try {
      const dateTime = new Date(`${date}T${time}`).getTime();

      await createEvent({
        name: name.trim(),
        description: description.trim() || undefined,
        date: dateTime,
        location: location.trim() || undefined,
        max_guests: maxGuests ? parseInt(maxGuests) : undefined,
        allow_plus_one: allowPlusOne,
        plus_one_limit: allowPlusOne ? parseInt(plusOneLimit) || 1 : 0,
      });

      navigate('/dashboard');
    } catch (err) {
      setError((err as Error)?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A12]">
      {/* Header */}
      <header className="border-b border-[#A7B1C6]/10 bg-[#070A12]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-[#A7B1C6] hover:text-[#F4F7FF] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-xl font-bold text-[#F4F7FF]">Create Event</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        <Card className="bg-[#0B1020] border-[#A7B1C6]/10">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#F4F7FF]">Set the scene</CardTitle>
            <p className="text-[#A7B1C6]">Build your event. We&apos;ll generate the link and the master QR.</p>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/30">
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#F4F7FF]">
                  Event Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Summer Launch Party"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-[#070A12] border-[#A7B1C6]/20 text-[#F4F7FF] placeholder:text-[#A7B1C6]/50 focus:border-[#00F0FF] focus:ring-[#00F0FF]/20"
                />
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-[#F4F7FF]">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add details about your event..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="bg-[#070A12] border-[#A7B1C6]/20 text-[#F4F7FF] placeholder:text-[#A7B1C6]/50 focus:border-[#00F0FF] focus:ring-[#00F0FF]/20 resize-none"
                />
              </div>
              
              {/* Date & Time */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-[#F4F7FF]">
                    Date <span className="text-red-400">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A7B1C6]" />
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="bg-[#070A12] border-[#A7B1C6]/20 text-[#F4F7FF] pl-10 focus:border-[#00F0FF] focus:ring-[#00F0FF]/20"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-[#F4F7FF]">
                    Time <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="bg-[#070A12] border-[#A7B1C6]/20 text-[#F4F7FF] focus:border-[#00F0FF] focus:ring-[#00F0FF]/20"
                  />
                </div>
              </div>
              
              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-[#F4F7FF]">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A7B1C6]" />
                  <Input
                    id="location"
                    type="text"
                    placeholder="e.g., The Grand Ballroom, 123 Main St"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="bg-[#070A12] border-[#A7B1C6]/20 text-[#F4F7FF] placeholder:text-[#A7B1C6]/50 pl-10 focus:border-[#00F0FF] focus:ring-[#00F0FF]/20"
                  />
                </div>
              </div>
              
              {/* Max Guests */}
              <div className="space-y-2">
                <Label htmlFor="maxGuests" className="text-[#F4F7FF]">Max Guests</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A7B1C6]" />
                  <Input
                    id="maxGuests"
                    type="number"
                    min="1"
                    placeholder="Leave empty for unlimited"
                    value={maxGuests}
                    onChange={(e) => setMaxGuests(e.target.value)}
                    className="bg-[#070A12] border-[#A7B1C6]/20 text-[#F4F7FF] placeholder:text-[#A7B1C6]/50 pl-10 focus:border-[#00F0FF] focus:ring-[#00F0FF]/20"
                  />
                </div>
                <p className="text-xs text-[#A7B1C6]/70">Optional. Leave empty for unlimited guests.</p>
              </div>
              
              {/* Plus One Toggle */}
              <div className="p-4 rounded-xl bg-[#070A12] border border-[#A7B1C6]/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label htmlFor="plusOne" className="text-[#F4F7FF] font-medium">Allow Plus-Ones</Label>
                    <p className="text-sm text-[#A7B1C6]">Let guests bring additional people</p>
                  </div>
                  <Switch
                    id="plusOne"
                    checked={allowPlusOne}
                    onCheckedChange={setAllowPlusOne}
                  />
                </div>
                
                {allowPlusOne && (
                  <div className="pt-4 border-t border-[#A7B1C6]/10">
                    <Label htmlFor="plusOneLimit" className="text-[#F4F7FF] mb-2 block">
                      Max Plus-Ones per Guest
                    </Label>
                    <Input
                      id="plusOneLimit"
                      type="number"
                      min="1"
                      max="10"
                      value={plusOneLimit}
                      onChange={(e) => setPlusOneLimit(e.target.value)}
                      className="bg-[#0B1020] border-[#A7B1C6]/20 text-[#F4F7FF] w-32 focus:border-[#00F0FF] focus:ring-[#00F0FF]/20"
                    />
                  </div>
                )}
              </div>
              
              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 border-[#A7B1C6]/20 text-[#F4F7FF] hover:bg-[#A7B1C6]/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#00F0FF] text-[#070A12] hover:bg-[#00F0FF]/90 font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Event
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
