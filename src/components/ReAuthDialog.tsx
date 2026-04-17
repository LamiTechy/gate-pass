import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { loginUser } from '@/api/users';
import { getCurrentUser } from '@/utils/auth';

interface ReAuthDialogProps {
  open: boolean;
  onSuccess: () => void;
  onLogout: () => void;
}

export function ReAuthDialog({ open, onSuccess, onLogout }: ReAuthDialogProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = getCurrentUser();
      if (!user) {
        setError('User session not found');
        return;
      }

      const result = await loginUser(user.email, password);
      if (result) {
        setPassword('');
        setError('');
        onSuccess();
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError((err as Error)?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setPassword('');
    setError('');
    onLogout();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      // Don't allow closing this dialog by clicking outside
      if (!isOpen && !loading) {
        handleLogout();
      }
    }}>
      <DialogContent className="sm:max-w-[425px] bg-[#0a0e1a] border border-gray-800" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-white">Session Verification Required</DialogTitle>
          <DialogDescription className="text-gray-400">
            For security, please re-enter your password to continue
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleReAuth} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-950 border-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
              required
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              disabled={loading}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-900"
            >
              Logout
            </Button>
            <Button
              type="submit"
              disabled={loading || !password}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
