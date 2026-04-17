import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { AppContent } from '@/AppContent';

// Pages
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { CreateEvent } from '@/pages/CreateEvent';
import { EventDetails } from '@/pages/EventDetails';
import { GuestRegistration } from '@/pages/GuestRegistration';
import { Verify } from '@/pages/Verify';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <AppContent>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Guest Routes */}
            <Route path="/register/:eventId" element={<GuestRegistration />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/verify/:token" element={<Verify />} />
            
            {/* Host Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-event" element={<CreateEvent />} />
            <Route path="/event/:id" element={<EventDetails />} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#0B1020',
              border: '1px solid rgba(167, 177, 198, 0.1)',
              color: '#F4F7FF',
            },
          }}
        />
      </AppContent>
    </AuthProvider>
  );
}

export default App;
