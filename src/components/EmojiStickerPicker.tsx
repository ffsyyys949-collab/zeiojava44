import React, { useState } from 'react';
import {
  Smile,
  Heart,
  Flame,
  ThumbsUp,
  Star,
  Zap,
  Coffee,
  Moon,
  Sun,
  Music,
  Camera,
  Gift,
  Trophy,
  Bug,
  MessageCircle,
  Send,
  Bell,
  Compass,
  Radio,
  CheckCircle2,
  XCircle,
  Eye,
  Bookmark,
  Layers,
  X
} from 'lucide-react';

export interface StickerItem {
  id: string;
  name: string;
  url: string;
  category: 'pack1' | 'pack2' | 'favorit';
}

// Transparent high-quality chibi/anime/cute stickers
export const STICKER_PACKS: StickerItem[] = [
  // Pack 1: Anime Chibi Expressions
  {
    id: 'stk_1',
    name: 'Waku Waku',
    category: 'pack1',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'stk_2',
    name: 'Anime Sparkle',
    category: 'pack1',
    url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'stk_3',
    name: 'Kawaii Cat Girl',
    category: 'pack1',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'stk_4',
    name: 'Cyberpunk Chibi',
    category: 'pack1',
    url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300&auto=format&fit=crop&q=80',
  },
  // Pack 2: Cute Pets & Companions
  {
    id: 'stk_5',
    name: 'Cute Shiba',
    category: 'pack2',
    url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'stk_6',
    name: 'Happy Cat',
    category: 'pack2',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'stk_7',
    name: 'Sleepy Fox',
    category: 'pack2',
    url: 'https://images.unsplash.com/photo-1516934024742-b461fba47600?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'stk_8',
    name: 'Panda Roll',
    category: 'pack2',
    url: 'https://images.unsplash.com/photo-1527118732049-c88155f2107c?w=300&auto=format&fit=crop&q=80',
  },
  // Favorit
  {
    id: 'stk_fav_1',
    name: 'Fire ZE',
    category: 'favorit',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'stk_fav_2',
    name: 'Gaming Glow',
    category: 'favorit',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80',
  },
];

// White Monochrome Outline Vector Emojis (No yellow emojis!)
export const WHITE_OUTLINE_EMOJIS = [
  { id: 'smile', label: 'Senyum', icon: Smile, textCode: '[:smile:]' },
  { id: 'heart', label: 'Love', icon: Heart, textCode: '[:heart:]' },
  { id: 'flame', label: 'Fire', icon: Flame, textCode: '[:fire:]' },
  { id: 'thumbsup', label: 'Like', icon: ThumbsUp, textCode: '[:like:]' },
  { id: 'star', label: 'Star', icon: Star, textCode: '[:star:]' },
  { id: 'sparkles', label: 'Kilau', icon: Zap, textCode: '[:sparkles:]' },
  { id: 'zap', label: 'Kilat', icon: Zap, textCode: '[:zap:]' },
  { id: 'coffee', label: 'Coffee', icon: Coffee, textCode: '[:coffee:]' },
  { id: 'moon', label: 'Moon', icon: Moon, textCode: '[:moon:]' },
  { id: 'sun', label: 'Sun', icon: Sun, textCode: '[:sun:]' },
  { id: 'music', label: 'Musik', icon: Music, textCode: '[:music:]' },
  { id: 'camera', label: 'Foto', icon: Camera, textCode: '[:camera:]' },
  { id: 'gift', label: 'Hadiah', icon: Gift, textCode: '[:gift:]' },
  { id: 'trophy', label: 'Juara', icon: Trophy, textCode: '[:trophy:]' },
  { id: 'bug', label: 'Bug', icon: Bug, textCode: '[:bug:]' },
  { id: 'msg', label: 'Chat', icon: MessageCircle, textCode: '[:chat:]' },
  { id: 'send', label: 'Send', icon: Send, textCode: '[:send:]' },
  { id: 'bell', label: 'Lonceng', icon: Bell, textCode: '[:bell:]' },
  { id: 'compass', label: 'Kompas', icon: Compass, textCode: '[:compass:]' },
  { id: 'radio', label: 'Radio', icon: Radio, textCode: '[:radio:]' },
  { id: 'check', label: 'Centang', icon: CheckCircle2, textCode: '[:check:]' },
  { id: 'cross', label: 'Silang', icon: XCircle, textCode: '[:cross:]' },
  { id: 'eye', label: 'Lihat', icon: Eye, textCode: '[:eye:]' },
  { id: 'bookmark', label: 'Simpan', icon: Bookmark, textCode: '[:bookmark:]' },
];

export function WhiteEmojiPicker({
  onSelectEmoji,
  onClose,
}: {
  onSelectEmoji: (textCode: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="bg-[#181818]/95 backdrop-blur-[24px] border-t border-white/10 rounded-t-[28px] p-4 shadow-2xl animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
        <div className="flex items-center gap-2">
          <Smile size={18} className="text-white" strokeWidth={1.5} />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Emoji Putih Outline</span>
        </div>
        <button onClick={onClose} className="p-1 text-white/50 hover:text-white cursor-pointer">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 max-h-48 overflow-y-auto no-scrollbar py-1">
        {WHITE_OUTLINE_EMOJIS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectEmoji(item.textCode)}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/15 border border-white/5 hover:border-white/20 flex flex-col items-center justify-center text-white transition active:scale-90 cursor-pointer"
              title={item.label}
            >
              <Icon size={20} className="text-white" strokeWidth={1.5} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StickerPicker({
  onSelectSticker,
  onClose,
}: {
  onSelectSticker: (sticker: StickerItem) => void;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'pack1' | 'pack2' | 'favorit'>('pack1');

  const filteredStickers = STICKER_PACKS.filter((s) => s.category === activeTab);

  return (
    <div className="bg-[#181818]/95 backdrop-blur-[24px] border-t border-white/10 rounded-t-[28px] p-4 shadow-2xl animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] mb-3">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-white" strokeWidth={1.5} />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Stiker WhatsApp Style</span>
        </div>
        <button onClick={onClose} className="p-1 text-white/50 hover:text-white cursor-pointer">
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setActiveTab('pack1')}
          className={`flex-1 py-1.5 rounded-full text-[11px] font-semibold transition cursor-pointer border ${
            activeTab === 'pack1'
              ? 'bg-white text-black border-white'
              : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
          }`}
        >
          Pack 1 (Anime)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pack2')}
          className={`flex-1 py-1.5 rounded-full text-[11px] font-semibold transition cursor-pointer border ${
            activeTab === 'pack2'
              ? 'bg-white text-black border-white'
              : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
          }`}
        >
          Pack 2 (Cute Pets)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('favorit')}
          className={`flex-1 py-1.5 rounded-full text-[11px] font-semibold transition cursor-pointer border ${
            activeTab === 'favorit'
              ? 'bg-white text-black border-white'
              : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
          }`}
        >
          Favorit
        </button>
      </div>

      {/* Sticker Grid */}
      <div className="grid grid-cols-4 gap-2.5 max-h-48 overflow-y-auto no-scrollbar py-1">
        {filteredStickers.map((stk) => (
          <button
            key={stk.id}
            type="button"
            onClick={() => onSelectSticker(stk)}
            className="w-full aspect-square rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 p-1 flex items-center justify-center transition active:scale-95 cursor-pointer overflow-hidden group"
          >
            <img
              src={stk.url}
              alt={stk.name}
              className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition"
              loading="lazy"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// Helper to render text with monochrome white outline emojis
export function renderMessageContent(text?: string) {
  if (!text) return null;

  // Check if text has code like [:fire:]
  const emojiRegex = /\[:([a-z0-9_-]+):\]/g;
  if (!emojiRegex.test(text)) {
    return <span className="leading-relaxed break-words">{text}</span>;
  }

  const parts = text.split(/(\[:[a-z0-9_-]+:\])/g);
  return (
    <span className="leading-relaxed break-words inline-flex flex-wrap items-center gap-1">
      {parts.map((part, idx) => {
        const match = part.match(/\[:([a-z0-9_-]+):\]/);
        if (match) {
          const code = match[1];
          const found = WHITE_OUTLINE_EMOJIS.find((e) => e.id === code);
          if (found) {
            const IconComponent = found.icon;
            return (
              <span key={idx} className="inline-flex items-center justify-center align-middle mx-0.5">
                <IconComponent size={18} className="text-white inline-block stroke-[1.5]" />
              </span>
            );
          }
        }
        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
}
