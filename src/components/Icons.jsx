import React from 'react';
import {
  Music4, Music2, Music3, Music,
  Headphones, MicVocal, Clapperboard, Gamepad2, Dices,
  Palette, House, Settings, Search, X, ArrowLeft, ArrowRight,
  ArrowUp, ArrowDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Play, CirclePause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, Heart, Volume2, Volume1, VolumeX,
  Sparkles, Disc3, Disc, List, FilePenLine, MessageCircle,
  Info, Upload, Folder, FolderOpen, FileText, Inbox,
  HeartCrack, LogOut, Lock, ThumbsUp, Trash2,
  Clock, BarChart3, BarChart4, AudioLines, Save, Lightbulb,
  Keyboard, GalleryHorizontal, ScrollText,
  Cloud, Moon, Flame, Sunrise, Star, Square, Wind, Wand2,
  RefreshCw, Monitor, RotateCw, Droplet, Droplets,
  Circle, Ban, CloudRain, CloudFog,
  PanelRightClose, PanelRightOpen,
  Gem, Check, Loader, XCircle, Ellipsis,
  // additional
  Rabbit, Drama,
} from 'lucide-react';

/**
 * Icon mapping: string name → React component.
 * Add new mappings here as the single source of truth.
 */
const iconMap = {
  // ── Music / Media ──
  'music': Music4,
  'music-note': Music2,
  'music-note-sm': Music,
  'headphones': Headphones,
  'mic': MicVocal,
  'guitar': Music,
  'drum': Music3,
  'clapperboard': Clapperboard,
  'gamepad': Gamepad2,
  'dice': Dices,
  'drama': Drama,
  'palette': Palette,

  // ── Navigation ──
  'home': House,
  'settings': Settings,
  'search': Search,
  'x': X,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,

  // ── Player controls ──
  'play': Play,
  'pause': CirclePause,
  'skip-back': SkipBack,
  'skip-forward': SkipForward,
  'shuffle': Shuffle,
  'repeat': Repeat,
  'repeat-1': Repeat1,
  'heart': Heart,
  'heart-filled': Heart,
  'volume-2': Volume2,
  'volume-1': Volume1,
  'volume-x': VolumeX,

  // ── Decorative ──
  'sparkles': Sparkles,
  'disc': Disc3,
  'disc-alt': Disc,

  // ── Content / Actions ──
  'list': List,
  'edit': FilePenLine,
  'comment': MessageCircle,
  'info': Info,
  'upload': Upload,
  'folder': Folder,
  'folder-open': FolderOpen,
  'file': FileText,
  'empty': Inbox,
  'heart-broken': HeartCrack,
  'logout': LogOut,
  'lock': Lock,
  'thumbs-up': ThumbsUp,
  'trash': Trash2,
  'clock': Clock,
  'chart': BarChart3,
  'chart-alt': BarChart4,
  'wave': AudioLines,
  'save': Save,
  'bulb': Lightbulb,
  'spotlight': Lightbulb,
  'keyboard': Keyboard,
  'card': GalleryHorizontal,
  'scroll': ScrollText,
  'more': Ellipsis,

  // ── Theme / Mood ──
  'cloud': Cloud,
  'moon': Moon,
  'fire': Flame,
  'heart-green': Heart,
  'glow': Sunrise,
  'star': Star,
  'aurora': Sparkles,
  'square': Square,
  'wind': Wind,
  'blur': Wand2,
  'twirl': Sparkles,
  'flip': RefreshCw,
  'bounce': Circle,
  'spring': Rabbit,
  'glitch': Monitor,
  'cyclone': RotateCw,

  // ── Spectrum / Visual ──
  'signal': BarChart4,
  'droplet': Droplet,
  'raindrop': Droplets,
  'circle': Circle,
  'ban': Ban,
  'rain': CloudRain,
  'bubble': Circle,
  'fog': CloudFog,

  // ── UI ──
  'now-playing': Disc,
  'sidebar-hide': PanelRightClose,
  'sidebar-show': PanelRightOpen,
  'lantern': Flame,
  'gem': Gem,
  'check': Check,
  'loading': Loader,
  'error': XCircle,
  'tv': Monitor,

  // ── Volume helpers (used with conditional logic) ──
  'volume-mute': VolumeX,
  'volume-low': Volume1,
  'volume-high': Volume2,
};

/**
 * Renders a lucide icon by its string name.
 *
 * @param {string}  name      – key from iconMap
 * @param {number}  [size=20] – icon size in px
 * @param {string}  [className] – additional CSS class
 * @param {object}  [style]   – inline styles
 * @param {string|boolean} [fill] – 'currentColor' for filled, false for outline
 */
export default function Icon({ name, size = 20, className = '', style = {}, fill, ...rest }) {
  const Component = iconMap[name];
  if (!Component) {
    console.warn(`Icon "${name}" not found in iconMap, falling back to Circle.`);
    return <Circle size={size} className={className} style={style} {...rest} />;
  }
  return (
    <Component
      size={size}
      className={className}
      style={style}
      fill={fill || undefined}
      {...rest}
    />
  );
}

// ── Pre-configured special icons for common patterns ──

/** Filled red heart for "favorited" state */
export function HeartFilled({ size = 18, className = '', ...rest }) {
  return <Heart size={size} className={className} fill="currentColor" {...rest} />;
}

/** Outline heart for "not favorited" state */
export function HeartOutline({ size = 18, className = '', ...rest }) {
  return <Heart size={size} className={className} {...rest} />;
}

/** Play button icon */
export function PlayIcon({ size = 20, className = '', ...rest }) {
  return <Play size={size} className={className} fill="currentColor" {...rest} />;
}

/** Pause button icon */
export function PauseIcon({ size = 20, className = '', ...rest }) {
  return <CirclePause size={size} className={className} fill="currentColor" {...rest} />;
}

/** Volume icon that adapts to level + mute */
export function VolumeIcon({ volume, isMuted, size = 18, className = '', ...rest }) {
  if (isMuted || volume === 0) return <VolumeX size={size} className={className} {...rest} />;
  if (volume < 0.5) return <Volume1 size={size} className={className} {...rest} />;
  return <Volume2 size={size} className={className} {...rest} />;
}

/** Shuffle icon */
export { Shuffle, Repeat, Repeat1, SkipBack, SkipForward, Search, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowLeft, ArrowRight, Heart };
