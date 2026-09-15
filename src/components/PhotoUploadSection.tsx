import React, { useState, useRef } from 'react';
import { GamePhoto } from '../types';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  Tag,
  Check,
  Plus,
  Sparkles,
  Info,
} from 'lucide-react';

interface PhotoUploadSectionProps {
  photos: GamePhoto[];
  onPhotosChange: (updatedPhotos: GamePhoto[]) => void;
  onSelectForBoardAnalysis?: (base64Url: string) => void;
}

const PRESET_SAMPLE_PHOTOS = [
  {
    name: 'Catan Island Board',
    url: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80',
    category: 'board' as const,
    caption: 'Catan Hex grid layout with settlement and road placements',
  },
  {
    name: 'Dice & Card Battle',
    url: 'https://images.unsplash.com/photo-1563941402622-4e7a488bcc57?auto=format&fit=crop&w=800&q=80',
    category: 'components' as const,
    caption: 'Active dice rolls and inventory tokens',
  },
  {
    name: 'Tabletop Strategy Grid',
    url: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=800&q=80',
    category: 'board' as const,
    caption: 'Overview of tactical miniature positioning',
  },
];

export const PhotoUploadSection: React.FC<PhotoUploadSectionProps> = ({
  photos = [],
  onPhotosChange,
  onSelectForBoardAnalysis,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<GamePhoto['category']>('board');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<GamePhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose a valid image file (JPEG, PNG, WebP).');
      return;
    }
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const newPhoto: GamePhoto = {
        id: 'photo_' + Date.now(),
        url: result,
        caption: caption.trim() || file.name,
        category: category,
        uploadedAt: new Date().toISOString(),
      };
      onPhotosChange([newPhoto, ...photos]);
      setCaption('');
      setPreviewUrl(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDeletePhoto = (id: string) => {
    onPhotosChange(photos.filter((p) => p.id !== id));
    if (selectedPhoto?.id === id) setSelectedPhoto(null);
  };

  const handleAddSample = (sample: (typeof PRESET_SAMPLE_PHOTOS)[0]) => {
    const newPhoto: GamePhoto = {
      id: 'photo_sample_' + Date.now(),
      url: sample.url,
      caption: sample.caption,
      category: sample.category,
      uploadedAt: new Date().toISOString(),
    };
    onPhotosChange([newPhoto, ...photos]);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center border border-pink-500/20">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Game Photos & Board Captures
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Upload photos of your physical board, cards, or pieces for state tracking and computer vision analysis.
            </p>
          </div>
        </div>

        {/* Preset sample quick-add */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400">Quick Samples:</span>
          {PRESET_SAMPLE_PHOTOS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddSample(s)}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              + {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-pink-500 bg-pink-500/10'
            : 'border-slate-700 hover:border-slate-500 bg-slate-950/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />
        <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mx-auto mb-2">
          <Upload className="w-6 h-6" />
        </div>
        <p className="text-xs font-semibold text-slate-200">
          Click to upload photo or drag & drop here
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Supports PNG, JPG, WebP from mobile camera or desktop
        </p>
      </div>

      {uploadError && (
        <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Controls: Tagging & Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Category Tag for next photo
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {(['board', 'components', 'cards', 'score', 'general'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${
                  category === cat
                    ? 'bg-pink-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Photo Caption or Round Note
          </label>
          <input
            type="text"
            placeholder="e.g. End of Turn 3 board arrangement..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
          />
        </div>
      </div>

      {/* Gallery Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-slate-600 transition-all shadow-md flex flex-col"
            >
              <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.caption || 'Game snapshot'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-semibold text-pink-300 uppercase tracking-wider backdrop-blur-xs">
                  {photo.category}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Delete photo"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <div className="p-2 flex-1 flex flex-col justify-between text-left">
                <p className="text-[11px] font-medium text-slate-200 line-clamp-1">
                  {photo.caption || 'Untitled photograph'}
                </p>
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                  <span>{new Date(photo.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {onSelectForBoardAnalysis && (
                    <button
                      type="button"
                      onClick={() => onSelectForBoardAnalysis(photo.url)}
                      className="text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      Analyze Board
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-slate-500 text-xs">
          No game photos uploaded yet. Snap a picture of your board or click one of the quick samples above!
        </div>
      )}
    </div>
  );
};
