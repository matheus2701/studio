
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ProceduresProvider } from '@/contexts/ProceduresContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppointmentsProvider } from '@/contexts/AppointmentsContext'; // Import AppointmentsProvider
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Agende Valery Studio',
  description: 'Agendamento de procedimentos estéticos.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <AuthProvider>
          <ProceduresProvider>
            <AppointmentsProvider> {/* Add AppointmentsProvider here */}
              <ProtectedLayout>
                {children}
              </ProtectedLayout>
            </AppointmentsProvider>
          </ProceduresProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
