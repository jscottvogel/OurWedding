import JSZip from 'jszip';
import { downloadBlob, safeFilename } from '@/lib/export/download';

export interface GalleryZipItem {
  id: string;
  url?: string;
  fileKey?: string | null;
}

/**
 * Client-side: fetch each photo via its presigned URL and bundle into a ZIP.
 * Fetches with limited concurrency; failed downloads are skipped and counted.
 */
export async function zipAndDownloadGallery(
  photos: GalleryZipItem[],
  filename = 'wedding_gallery.zip',
  onProgress?: (done: number, total: number) => void,
): Promise<{ added: number; failed: number }> {
  const zip = new JSZip();
  const used = new Set<string>();
  const withUrl = photos.filter((p) => p.url);
  let done = 0, added = 0, failed = 0;
  const queue = [...withUrl];

  const worker = async () => {
    while (queue.length) {
      const p = queue.shift()!;
      try {
        const res = await fetch(p.url!);
        if (!res.ok) throw new Error(String(res.status));
        let name = safeFilename(p.fileKey?.split('/').pop() || `${p.id}.jpg`);
        while (used.has(name)) name = `${p.id.slice(0, 6)}-${name}`;
        used.add(name);
        zip.file(name, await res.blob());
        added++;
      } catch {
        failed++;
      }
      onProgress?.(++done, withUrl.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, withUrl.length) }, worker));
  if (added === 0) throw new Error('No photos could be downloaded');
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, filename);
  return { added, failed };
}
