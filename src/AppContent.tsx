import { useAuth } from '@/contexts/AuthContext';
import { ReAuthDialog } from '@/components/ReAuthDialog';
import type { ReactNode } from 'react';

export function AppContent({ children }: { children: ReactNode }) {
  const { logout, completeReAuth, requiresReAuth } = useAuth();

  const handleReAuthSuccess = () => {
    completeReAuth();
  };

  const handleReAuthLogout = () => {
    logout();
  };

  return (
    <>
      {children}
      <ReAuthDialog
        open={requiresReAuth}
        onSuccess={handleReAuthSuccess}
        onLogout={handleReAuthLogout}
      />
    </>
  );
}
