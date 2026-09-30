import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'Kasir Dito - Sistem Kasir & POS Modern',
  description: 'Aplikasi Point of Sale (POS) Kasir',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-800">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
