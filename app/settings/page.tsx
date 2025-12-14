'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/contexts';
import { Header } from '@/components/layout';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <Link
          href="/books"
          className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Books
        </Link>

        <h1 className="text-3xl font-bold text-text-primary mb-8">Settings</h1>

        {/* Account Information */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-text-primary mb-6">Account Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Email</label>
              <p className="text-text-primary font-medium">{user?.email}</p>
            </div>
            {user?.displayName && (
              <div>
                <label className="block text-sm text-text-secondary mb-1">Display Name</label>
                <p className="text-text-primary font-medium">{user.displayName}</p>
              </div>
            )}
            <div>
              <label className="block text-sm text-text-secondary mb-1">User ID</label>
              <p className="text-text-primary font-mono text-sm">{user?.uid}</p>
            </div>
          </div>
        </div>

        {/* App Information */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-text-primary mb-6">About</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Application</label>
              <p className="text-text-primary font-medium">Book Catalog</p>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Version</label>
              <p className="text-text-primary font-medium">1.0.0 (Next.js 15)</p>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Description</label>
              <p className="text-text-primary">
                A comprehensive application for cataloging your books with cloud synchronization powered by Firebase.
              </p>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="card">
          <h2 className="text-xl font-semibold text-text-primary mb-6">Technology Stack</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">Next</span>
              </div>
              <div>
                <p className="font-medium text-text-primary text-sm">Next.js 15</p>
                <p className="text-xs text-text-secondary">React Framework</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">TS</span>
              </div>
              <div>
                <p className="font-medium text-text-primary text-sm">TypeScript</p>
                <p className="text-xs text-text-secondary">Type Safety</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">TW</span>
              </div>
              <div>
                <p className="font-medium text-text-primary text-sm">Tailwind CSS</p>
                <p className="text-xs text-text-secondary">Styling</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">FB</span>
              </div>
              <div>
                <p className="font-medium text-text-primary text-sm">Firebase</p>
                <p className="text-xs text-text-secondary">Backend & Auth</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">R18</span>
              </div>
              <div>
                <p className="font-medium text-text-primary text-sm">React 18</p>
                <p className="text-xs text-text-secondary">UI Library</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">SSR</span>
              </div>
              <div>
                <p className="font-medium text-text-primary text-sm">SSR Enabled</p>
                <p className="text-xs text-text-secondary">Performance</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
