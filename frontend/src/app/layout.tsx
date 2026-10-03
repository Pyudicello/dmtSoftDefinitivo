import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PREVENIA — Plataforma SaaS de Gestión de Higiene y Seguridad Laboral',
  description: 'Fundación técnica SaaS para consultoras y empresas de Higiene y Seguridad Laboral. Gestión centralizada de vencimientos y obligaciones normativas.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
