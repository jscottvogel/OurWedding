import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

export interface PlaceCard {
  id: string;
  name: string;
  tableName: string | null;
  qrDataUrl: string | null;
}

// Tent cards: 4 per Letter page (2 x 2). Each card is folded along its middle; the front (lower
// half) carries the name, table and the scan-to-serve QR code.
const styles = StyleSheet.create({
  page: { padding: 24, flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#FFFFFF' },
  card: { width: '50%', height: '50%', padding: 8 },
  inner: { flex: 1, borderWidth: 0.5, borderColor: '#B8C4B0', borderStyle: 'dashed' },
  back: { flex: 1, borderBottomWidth: 0.5, borderBottomColor: '#DDDDDD', borderBottomStyle: 'dotted' },
  front: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 10, position: 'relative' },
  name: { fontFamily: 'Times-Italic', fontSize: 26, color: '#2F3A2E', textAlign: 'center' },
  table: { fontFamily: 'Helvetica', fontSize: 10, letterSpacing: 2, color: '#7A8B6F', marginTop: 8, textTransform: 'uppercase' },
  couple: { fontFamily: 'Times-Roman', fontSize: 8, color: '#999999', marginTop: 4 },
  qr: { position: 'absolute', right: 8, bottom: 8, width: 44, height: 44 },
});

export function PlaceCardsPDF({ cards, coupleNames }: { cards: PlaceCard[]; coupleNames: string }) {
  const pages: PlaceCard[][] = [];
  for (let i = 0; i < cards.length; i += 4) pages.push(cards.slice(i, i + 4));
  return (
    <Document title="Place cards">
      {pages.map((group, p) => (
        <Page key={p} size="LETTER" style={styles.page}>
          {group.map((c) => (
            <View key={c.id} style={styles.card} wrap={false}>
              <View style={styles.inner}>
                <View style={styles.back} />
                <View style={styles.front}>
                  <Text style={styles.name}>{c.name}</Text>
                  {c.tableName && <Text style={styles.table}>{c.tableName}</Text>}
                  <Text style={styles.couple}>{coupleNames}</Text>
                  {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image has no alt prop */}
                  {c.qrDataUrl && <Image src={c.qrDataUrl} style={styles.qr} />}
                </View>
              </View>
            </View>
          ))}
        </Page>
      ))}
    </Document>
  );
}
