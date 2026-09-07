import './globals.css';
import AppLayout from '@/components/AppLayout';
import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

export const metadata = {
  title: 'AWS Route53 Clone',
  description: 'AWS Route53 console clone built with Next.js and FastAPI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body>
        <AuthProvider>
          <NotificationProvider>
            <AppLayout>{children}</AppLayout>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
