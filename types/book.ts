export enum ReadingStatus {
  TO_READ = 'toRead',
  READING = 'reading',
  FINISHED = 'finished',
}

export const ReadingStatusDisplay: Record<ReadingStatus, string> = {
  [ReadingStatus.TO_READ]: 'To Read',
  [ReadingStatus.READING]: 'Reading',
  [ReadingStatus.FINISHED]: 'Finished',
};

export interface Book {
  id: string;
  userId: string;
  title: string;
  author?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  publishedDate?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  pageCount?: number | null;
  categories?: string[] | null;
  language?: string | null;
  purchaseDate?: string | null; // ISO string
  purchaseDateUnknown: boolean;
  startReadingDate?: string | null; // ISO string
  finishReadingDate?: string | null; // ISO string
  status: ReadingStatus;
  dateAdded: string; // ISO string
  dateModified?: string | null; // ISO string
}

export interface BookFormData {
  title: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  publishedDate?: string;
  description?: string;
  coverImageUrl?: string;
  pageCount?: number;
  categories?: string[];
  language?: string;
  purchaseDate?: string;
  purchaseDateUnknown: boolean;
  startReadingDate?: string;
  finishReadingDate?: string;
  status: ReadingStatus;
}

export const readingStatusFromString = (status: string): ReadingStatus => {
  const normalized = status.toLowerCase().replace(/\s+/g, '');
  switch (normalized) {
    case 'toread':
      return ReadingStatus.TO_READ;
    case 'reading':
      return ReadingStatus.READING;
    case 'finished':
    case 'completed':
      return ReadingStatus.FINISHED;
    default:
      return ReadingStatus.TO_READ;
  }
};
