'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth, useBooks } from '@/lib/contexts';
import { Header } from '@/components/layout';

interface Stats {
  total: number;
  toRead: number;
  reading: number;
  finished: number;
}

export default function StatisticsPage() {
  const { user } = useAuth();
  const { getStats } = useBooks();
  const [stats, setStats] = useState<Stats>({ total: 0, toRead: 0, reading: 0, finished: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const fetchedStats = await getStats();
        setStats(fetchedStats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user, getStats]);

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const StatCard = ({
    title,
    value,
    icon,
    gradient,
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    gradient: string;
  }) => (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text-secondary font-medium">{title}</h3>
        <div className={`w-12 h-12 ${gradient} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-4xl font-bold text-text-primary">{value}</p>
    </div>
  );

  const ProgressBar = ({ label, value, total, color }: {
    label: string;
    value: number;
    total: number;
    color: string;
  }) => {
    const percentage = getPercentage(value, total);
    return (
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-text-primary font-medium">{label}</span>
          <span className="text-text-secondary">{value} ({percentage}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full ${color} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

        <h1 className="text-3xl font-bold text-text-primary mb-8">Reading Statistics</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Books"
            value={stats.total}
            gradient="gradient-primary"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            }
          />

          <StatCard
            title="To Read"
            value={stats.toRead}
            gradient="bg-warning"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />

          <StatCard
            title="Reading"
            value={stats.reading}
            gradient="bg-secondary"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            }
          />

          <StatCard
            title="Finished"
            value={stats.finished}
            gradient="bg-success"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
        </div>

        {/* Reading Progress */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-6">Reading Progress</h2>
          <div className="space-y-6">
            <ProgressBar
              label="To Read"
              value={stats.toRead}
              total={stats.total}
              color="bg-warning"
            />
            <ProgressBar
              label="Currently Reading"
              value={stats.reading}
              total={stats.total}
              color="bg-secondary"
            />
            <ProgressBar
              label="Finished"
              value={stats.finished}
              total={stats.total}
              color="bg-success"
            />
          </div>
        </div>

        {/* Reading Stats Summary */}
        <div className="card">
          <h2 className="text-xl font-semibold text-text-primary mb-6">Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-text-secondary">Completion Rate</span>
              <span className="font-bold text-text-primary text-lg">
                {getPercentage(stats.finished, stats.total)}%
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-text-secondary">Books in Progress</span>
              <span className="font-bold text-text-primary text-lg">{stats.reading}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-text-secondary">Books Remaining</span>
              <span className="font-bold text-text-primary text-lg">{stats.toRead}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
