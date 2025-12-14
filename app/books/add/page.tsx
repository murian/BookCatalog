'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useBooks } from '@/lib/contexts';
import { Header } from '@/components/layout';
import { ReadingStatus } from '@/types';

export default function AddBookPage() {
  const { user } = useAuth();
  const { addBook } = useBooks();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    publishedDate: '',
    description: '',
    coverImageUrl: '',
    pageCount: '',
    categories: '',
    language: '',
    status: ReadingStatus.TO_READ,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.title.trim()) {
      setError('Title is required');
      setLoading(false);
      return;
    }

    try {
      const bookData = {
        title: formData.title.trim(),
        author: formData.author.trim() || null,
        isbn: formData.isbn.trim() || null,
        publisher: formData.publisher.trim() || null,
        publishedDate: formData.publishedDate || null,
        description: formData.description.trim() || null,
        coverImageUrl: formData.coverImageUrl.trim() || null,
        pageCount: formData.pageCount ? parseInt(formData.pageCount) : null,
        categories: formData.categories
          ? formData.categories.split(',').map((c) => c.trim()).filter(Boolean)
          : null,
        language: formData.language.trim() || null,
        status: formData.status,
        purchaseDateUnknown: false,
      };

      await addBook(bookData);
      router.push('/books');
    } catch (err: any) {
      setError(err.message || 'Failed to add book');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

        <div className="card">
          <h1 className="text-2xl font-bold text-text-primary mb-6">Add New Book</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-button text-sm">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-2">
                Title <span className="text-error">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                required
                disabled={loading}
              />
            </div>

            {/* Author */}
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-text-primary mb-2">
                Author
              </label>
              <input
                id="author"
                name="author"
                type="text"
                value={formData.author}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              />
            </div>

            {/* ISBN */}
            <div>
              <label htmlFor="isbn" className="block text-sm font-medium text-text-primary mb-2">
                ISBN
              </label>
              <input
                id="isbn"
                name="isbn"
                type="text"
                value={formData.isbn}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              />
            </div>

            {/* Publisher */}
            <div>
              <label htmlFor="publisher" className="block text-sm font-medium text-text-primary mb-2">
                Publisher
              </label>
              <input
                id="publisher"
                name="publisher"
                type="text"
                value={formData.publisher}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              />
            </div>

            {/* Published Date */}
            <div>
              <label htmlFor="publishedDate" className="block text-sm font-medium text-text-primary mb-2">
                Published Date
              </label>
              <input
                id="publishedDate"
                name="publishedDate"
                type="text"
                value={formData.publishedDate}
                onChange={handleChange}
                placeholder="e.g., 2023, Jan 2023, or 2023-01-15"
                className="input-field"
                disabled={loading}
              />
            </div>

            {/* Page Count */}
            <div>
              <label htmlFor="pageCount" className="block text-sm font-medium text-text-primary mb-2">
                Page Count
              </label>
              <input
                id="pageCount"
                name="pageCount"
                type="number"
                value={formData.pageCount}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              />
            </div>

            {/* Language */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-text-primary mb-2">
                Language
              </label>
              <input
                id="language"
                name="language"
                type="text"
                value={formData.language}
                onChange={handleChange}
                placeholder="e.g., English, Spanish"
                className="input-field"
                disabled={loading}
              />
            </div>

            {/* Cover Image URL */}
            <div>
              <label htmlFor="coverImageUrl" className="block text-sm font-medium text-text-primary mb-2">
                Cover Image URL
              </label>
              <input
                id="coverImageUrl"
                name="coverImageUrl"
                type="url"
                value={formData.coverImageUrl}
                onChange={handleChange}
                placeholder="https://example.com/cover.jpg"
                className="input-field"
                disabled={loading}
              />
            </div>

            {/* Categories */}
            <div>
              <label htmlFor="categories" className="block text-sm font-medium text-text-primary mb-2">
                Categories
              </label>
              <input
                id="categories"
                name="categories"
                type="text"
                value={formData.categories}
                onChange={handleChange}
                placeholder="Fiction, Mystery, Thriller (comma-separated)"
                className="input-field"
                disabled={loading}
              />
              <p className="text-xs text-text-secondary mt-1">Separate multiple categories with commas</p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="input-field resize-none"
                disabled={loading}
              />
            </div>

            {/* Reading Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-text-primary mb-2">
                Reading Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              >
                <option value={ReadingStatus.TO_READ}>To Read</option>
                <option value={ReadingStatus.READING}>Reading</option>
                <option value={ReadingStatus.FINISHED}>Finished</option>
              </select>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Link href="/books" className="flex-1 btn-secondary text-center">
                Cancel
              </Link>
              <button
                type="submit"
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Adding Book...' : 'Add Book'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
