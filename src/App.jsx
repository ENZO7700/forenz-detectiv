import React from 'react';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from 'next-themes';
import { PwaInstallProvider } from '@/lib/pwaInstall';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import ForenzDetectiv from './pages/ForenzDetectiv';
import SharedCase from './pages/SharedCase';
import Dashboard from './pages/Dashboard';
import { AuthProvider } from '@/lib/AuthContext';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <PwaInstallProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <ScrollToTop />
              <Routes>
                {/* Priamy prístup do ForenzDetectiv bez nutnosti prihlasovania */}
                <Route path="/" element={<ForenzDetectiv />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/shared/:token" element={<SharedCase />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Toaster />
            </Router>
          </QueryClientProvider>
        </AuthProvider>
      </PwaInstallProvider>
    </ThemeProvider>
  );
}