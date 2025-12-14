import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider, BooksProvider } from '@/lib/contexts';

export const metadata: Metadata = {
  title: 'Book Catalog - Organize Your Library',
  description: 'A comprehensive application for cataloging your books with AI-powered book identification and cloud synchronization with Firebase.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          <BooksProvider>
            {children}
          </BooksProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
