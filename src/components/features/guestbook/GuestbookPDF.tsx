import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fffdfd', // subtle ivory
    padding: 40,
    fontFamily: 'Times-Roman',
  },
  coverPage: {
    flexDirection: 'column',
    backgroundColor: '#7b957a', // sage green
    padding: 0,
    fontFamily: 'Times-Roman',
  },
  coverContent: {
    flex: 1,
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dark overlay if image exists
  },
  coverContentNoImage: {
    flex: 1,
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    objectFit: 'cover',
  },
  title: {
    fontSize: 42,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Times-Italic',
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontFamily: 'Helvetica',
  },
  date: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: '#475569',
    fontFamily: 'Times-Italic',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  entryCard: {
    width: '48%', // 2 columns
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  entryImage: {
    width: '100%',
    height: 150,
    objectFit: 'cover',
    marginBottom: 10,
  },
  message: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 1.5,
    marginBottom: 10,
    fontFamily: 'Times-Roman',
  },
  songBox: {
    backgroundColor: '#f8fafc',
    padding: 5,
    marginBottom: 10,
  },
  songText: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: 'Helvetica',
  },
  guestName: {
    fontSize: 14,
    color: '#0f172a',
    textAlign: 'right',
    fontFamily: 'Times-Italic',
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#94a3b8',
    fontFamily: 'Helvetica',
  },
});

interface GuestbookPDFProps {
  weddingName: string;
  weddingDate?: string;
  venueName?: string;
  heroImageUrl?: string;
  entries: {
    id: string;
    guestName: string;
    message?: string;
    songRequest?: string;
    mediaUrl?: string;
  }[];
}

export const GuestbookPDF = ({ weddingName, weddingDate, venueName, heroImageUrl, entries }: GuestbookPDFProps) => {
  let formattedDate = 'Date TBD';
  if (weddingDate) {
    const [year, month, day] = weddingDate.split('-').map(Number);
    formattedDate = format(new Date(year, month - 1, day), 'MMMM d, yyyy');
  }

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        {heroImageUrl && (
          <Image src={heroImageUrl} style={styles.coverImage} />
        )}
        <View style={heroImageUrl ? styles.coverContent : styles.coverContentNoImage}>
          <Text style={styles.subtitle}>The Guestbook of</Text>
          <Text style={styles.title}>{weddingName}</Text>
          <Text style={styles.date}>{formattedDate}</Text>
          {venueName && <Text style={{ ...styles.date, marginTop: 5 }}>{venueName}</Text>}
        </View>
      </Page>

      {/* Entry Pages */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Messages & Memories</Text>
        
        <View style={styles.grid}>
          {entries.map((entry) => (
            <View key={entry.id} style={styles.entryCard} wrap={false}>
              {entry.mediaUrl && (
                <Image src={entry.mediaUrl} style={styles.entryImage} />
              )}
              {entry.message && (
                <Text style={styles.message}>"{entry.message}"</Text>
              )}
              {entry.songRequest && (
                <View style={styles.songBox}>
                  <Text style={styles.songText}>🎵 {entry.songRequest}</Text>
                </View>
              )}
              <Text style={styles.guestName}>— {entry.guestName}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};
