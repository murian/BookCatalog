enum ReadingStatus {
  toRead('To Read'),
  reading('Reading'),
  finished('Finished');

  final String displayName;
  const ReadingStatus(this.displayName);

  static ReadingStatus fromString(String status) {
    switch (status.toLowerCase()) {
      case 'to read':
      case 'toread':
        return ReadingStatus.toRead;
      case 'reading':
        return ReadingStatus.reading;
      case 'finished':
      case 'completed':
        return ReadingStatus.finished;
      default:
        return ReadingStatus.toRead;
    }
  }
}
