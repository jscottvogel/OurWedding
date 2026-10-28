'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getUrl, remove } from 'aws-amplify/storage';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from './useAuth';
import { getWeddingOwners } from '../amplify/weddingOwners';

const client = generateClient<Schema>();

export type GalleryPhoto = Schema['GalleryUpload']['type'] & {
  url?: string;
};

export function useGallery(publicWeddingId?: string) {
  const { weddingId: authWeddingId, loading: authLoading } = useAuth();
  const weddingId = publicWeddingId || authWeddingId;
  
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicWeddingId && authLoading) return;
    if (!weddingId) {
      setLoading(false);
      return;
    }

    const sub = client.models.GalleryUpload.observeQuery({
      filter: { weddingId: { eq: weddingId } },
      ...(publicWeddingId ? { authMode: 'apiKey' as const } : {})
    }).subscribe({
      next: async ({ items }) => {
        // Filter out deleted items locally due to AppSync negated boolean limitations
        // Public visitors only see approved uploads.
        const activeItems = items.filter(item =>
          !item.isDeleted && (!publicWeddingId || (item as { isApproved?: boolean | null }).isApproved !== false)
        );
        
        // Resolve S3 presigned URLs for each item
        const photosWithUrls = await Promise.all(
          activeItems.map(async (item) => {
            try {
              const urlResult = await getUrl({ path: item.fileKey });
              return { ...item, url: urlResult.url.toString() };
            } catch (e) {
              return { ...item };
            }
          })
        );
        
        // Sort by newest first
        photosWithUrls.sort((a, b) => {
          const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
          const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
          return dateB - dateA;
        });
        
        setPhotos(photosWithUrls);
        setLoading(false);
      },
      error: (err) => {
        console.error(err);
        setLoading(false);
      }
    });

    return () => sub.unsubscribe();
  }, [weddingId, authLoading, publicWeddingId]);

  const addPhotoRecord = async (record: Omit<Schema['GalleryUpload']['type'], 'id' | 'createdAt' | 'updatedAt' | 'weddingId'>) => {
    if (!weddingId) return;
    if (publicWeddingId) {
      const { errors } = await client.mutations.submitGalleryUpload({
        weddingId,
        uploaderName: record.uploaderName || 'Guest',
        fileKey: record.fileKey,
        fileType: record.fileType ?? undefined,
        fileSizeBytes: record.fileSizeBytes ?? undefined,
        caption: record.caption ?? undefined,
      }, { authMode: 'apiKey' });
      if (errors?.length) throw new Error(errors[0].message);
      return;
    }
    await client.models.GalleryUpload.create({
      ...record,
      weddingId,
      owners: await getWeddingOwners(weddingId)
    });
  };

  const deletePhoto = async (photo: GalleryPhoto) => {
    try {
      // Soft delete in database
      await client.models.GalleryUpload.update({
        id: photo.id,
        isDeleted: true
      });
      
      // We keep the actual S3 file for safety, or optionally delete it:
      // await remove({ path: photo.fileKey });
    } catch (err) {
      console.error('Failed to delete photo', err);
    }
  };

  const updatePhotoCaption = async (id: string, caption: string) => {
    try {
      await client.models.GalleryUpload.update({ id, caption });
    } catch (err) {
      console.error('Failed to update caption', err);
    }
  };

  const updatePhotoUploaderName = async (id: string, uploaderName: string) => {
    try {
      await client.models.GalleryUpload.update({ id, uploaderName });
    } catch (err) {
      console.error('Failed to update uploader name', err);
    }
  };

  const togglePhotoVisibility = async (id: string, showOnWebsite: boolean) => {
    try {
      await client.models.GalleryUpload.update({ id, showOnWebsite });
    } catch (err) {
      console.error('Failed to update visibility', err);
    }
  };

  return { photos, loading, addPhotoRecord, deletePhoto, updatePhotoCaption, updatePhotoUploaderName, togglePhotoVisibility, weddingId };
}
