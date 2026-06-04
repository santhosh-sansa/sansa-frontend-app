'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Heart, Download, Pencil, X } from 'lucide-react';

type GalleryImage = {
  id: number;
  title: string;
  likes: number;
  category: string;
  colors: [string, string];
  emoji: string;
};

const IMAGES: GalleryImage[] = [
  { id: 1, title: 'Mountain Sunset', likes: 1234, category: 'Nature', colors: ['#f97316', '#7c3aed'], emoji: '🏔️' },
  { id: 2, title: 'Cyberpunk City', likes: 2345, category: 'Urban', colors: ['#06b6d4', '#8b5cf6'], emoji: '🌃' },
  { id: 3, title: 'Fantasy Forest', likes: 3456, category: 'Fantasy', colors: ['#10b981', '#059669'], emoji: '🌲' },
  { id: 4, title: 'Abstract Art', likes: 4567, category: 'Abstract', colors: ['#ec4899', '#f43f5e'], emoji: '🎨' },
  { id: 5, title: 'Portrait AI', likes: 5678, category: 'Portrait', colors: ['#f59e0b', '#d97706'], emoji: '👤' },
  { id: 6, title: 'Space Odyssey', likes: 6789, category: 'Sci-Fi', colors: ['#1e3a5f', '#7c3aed'], emoji: '🚀' },
  { id: 7, title: 'Tamil Temple', likes: 3210, category: 'Culture', colors: ['#dc2626', '#f59e0b'], emoji: '🛕' },
  { id: 8, title: 'Ocean Waves', likes: 2100, category: 'Nature', colors: ['#0ea5e9', '#06b6d4'], emoji: '🌊' },
  { id: 9, title: 'Neon Dreams', likes: 4321, category: 'Urban', colors: ['#d946ef', '#8b5cf6'], emoji: '💜' },
];

const CATEGORIES = ['All', 'Nature', 'Urban', 'Fantasy', 'Abstract', 'Portrait', 'Sci-Fi', 'Culture'];

export function AnimatedGallery() {
  const [filter, setFilter] = useState('All');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [liked, setLiked] = useState<Set<number>>(new Set());

  const filtered = filter === 'All' ? IMAGES : IMAGES.filter(img => img.category === filter);

  const toggleLike = (id: number) => {
    setLiked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap animate-fade-in">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
              filter === cat
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {filtered.map((image) => (
          <div
            key={image.id}
            className="group relative cursor-pointer rounded-xl overflow-hidden hover-lift"
            onClick={() => setSelectedImage(image)}
          >
            {/* Image placeholder with gradient */}
            <div
              className="aspect-square flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${image.colors[0]}, ${image.colors[1]})` }}
            >
              <span className="text-6xl opacity-80 group-hover:scale-110 transition-transform duration-300">{image.emoji}</span>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="text-center text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <p className="font-semibold text-sm">{image.title}</p>
                <p className="text-xs text-white/70 mt-1">{image.category}</p>
              </div>
            </div>

            {/* Like button */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleLike(image.id); }}
              className="absolute top-3 right-3 rounded-full bg-black/30 p-2 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
            >
              <Heart className={cn('h-4 w-4', liked.has(image.id) ? 'fill-red-500 text-red-500' : 'text-white')} />
            </button>

            {/* Bottom info */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-white text-xs font-medium">{image.title}</p>
              <p className="text-white/60 text-[10px]">❤️ {image.likes.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedImage(null)}>
          <div className="max-w-2xl w-full bg-card rounded-xl overflow-hidden animate-scale-in shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Image */}
            <div
              className="aspect-video flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${selectedImage.colors[0]}, ${selectedImage.colors[1]})` }}
            >
              <span className="text-8xl">{selectedImage.emoji}</span>
            </div>

            {/* Info */}
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedImage.title}</h3>
                  <p className="text-xs text-muted-foreground">{selectedImage.category} • AI Generated</p>
                </div>
                <button onClick={() => setSelectedImage(null)} className="rounded-full p-2 hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">❤️ {selectedImage.likes.toLocaleString()} likes</span>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 gap-2"><Download className="h-4 w-4" />Download</Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={() => { setSelectedImage(null); window.location.href = '/studio/editor'; }}><Pencil className="h-4 w-4" />Edit in Studio</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
