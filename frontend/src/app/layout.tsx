import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { QueryProvider } from '@/context/QueryProvider';
import { ToastProvider } from '@/context/ToastContext';

export const metadata: Metadata = {
  title: 'PREVENIA — Plataforma SaaS de Higiene y Seguridad Laboral',
  description: 'Gestión centralizada de vencimientos, empresas y seguridad multi-tenant para consultoras de Higiene y Seguridad.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
