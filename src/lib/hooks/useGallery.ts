'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getUrl, remove } from 'aws-amplify/storage';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from './useAuth';

const client = generateClient<Schema>();

export interface GalleryPhoto extends Schema['GalleryUpload']['type'] {
  url?: string;
}

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
      filter: { weddingId: { eq: weddingId }, isDeleted: { ne: true } }
    }).subscribe({
      next: async ({ items }) => {
        // Resolve S3 presigned URLs for each item
        const photosWithUrls = await Promise.all(
          items.map(async (item) => {
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
    await client.models.GalleryUpload.create({
      ...record,
      weddingId
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

  return { photos, loading, addPhotoRecord, deletePhoto, weddingId };
}
