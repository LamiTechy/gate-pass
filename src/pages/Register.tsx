import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { registerUser } from '@/api/users';
import { useAuth } from '@/contexts/AuthContext';

export function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = (): boolean => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const user = await registerUser(email, password, name);

      if (user) {
        login(user);
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setError('Failed to create account. Please try again.');
      }
    } catch (err) {
      setError((err as Error)?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A12] flex items-center justify-center p-4">
      {/* Background effects */}
      <div 
        className="fixed top-1/4 -right-1/4 w-[500px] h-[500px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(0,240,255,0.3) 0%, transparent 70%)',
          filter: 'blur(80px)'
        }}
      />
      
      <div className="w-full max-w-md relative z-10">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="absolute -top-16 left-0 flex items-center gap-2 text-[#A7B1C6] hover:text-[#F4F7FF] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>
        
        <Card className="bg-[#0B1020] border-[#A7B1C6]/10">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#00F0FF]/10 flex items-center justify-center">
                <QrCode className="w-8 h-8 text-[#00F0FF]" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-[#F4F7FF]">Create account</CardTitle>
            <CardDescription className="text-[#A7B1C6]">
              Start creating amazing events
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/30">
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mb-6 bg-green-500/10 border-green-500/30">
                <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                <AlertDescription className="text-green-400">Account created successfully!</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#F4F7FF]">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-[#070A12] border-[#A7B1C6]/20 text-[#F4F7FF] placeholder:text-[#A7B1C6]/50 focus:border-[#00F0FF] focus:ring-[#00F0FF]/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#F4F7FF]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-[#070A12] border-[#A7B1C6]/20 text-[#F4F7FF] placeholder:text-[#A7B1C6]/50 focus:border-[#00F0FF] focus:ring-[#00F0FF]/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#F4F7FF]">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-[#070A12] border-[#A7B1C6]/20 text-[#F4F7FF] placeholder:text-[#A7B1C6]/50 focus:border-[#00F0FF] focus:ring-[#00F0FF]/20"
                />
                <p className="text-xs text-[#A7B1C6]/70">At least 6 characters</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#F4F7FF]">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-[#070A12] border-[#A7B1C6]/20 text-[#F4F7FF] placeholder:text-[#A7B1C6]/50 focus:border-[#00F0FF] focus:ring-[#00F0FF]/20"
                />
              </div>
              
              <Button
                type="submit"
                disabled={loading || success}
                className="w-full bg-[#00F0FF] text-[#070A12] hover:bg-[#00F0FF]/90 font-semibold py-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-[#A7B1C6] text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-[#00F0FF] hover:text-[#00F0FF]/80 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
