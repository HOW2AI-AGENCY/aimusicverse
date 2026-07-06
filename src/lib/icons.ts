/**
 * Centralized Icon Exports
 * Phase 1.1: Bundle Size Optimization
 * Phase A: Design Tokens Reset — standardized strokeWidth & icon sizing
 *
 * IMPORTANT: Import icons from this file instead of 'lucide-react' directly.
 * This enables better tree-shaking and consistent icon usage across the app.
 *
 * @example
 * ```tsx
 * // ❌ Bad - direct import prevents optimal tree-shaking
 * import { Heart, Play, Pause } from 'lucide-react';
 *
 * // ✅ Good - centralized import with standardized strokeWidth
 * import { Heart, Play, Pause } from '@/lib/icons';
 * <Heart strokeWidth={ICON_STROKE_WIDTH} className="w-5 h-5" />
 * ```
 */

// Re-export LucideIcon type for component props
export type { LucideIcon, LucideProps } from "lucide-react";

// ============================================================================
// STANDARDIZED ICON CONFIGURATION (Phase A: Lila-Ban / Anti-Card)
// ============================================================================

/**
 * Standard icon stroke width — 1.75 (vs Lucide default 2.0).
 * Thinner stroke reads as more refined/professional at small sizes (16-24px),
 * which is the dominant icon range in this Telegram Mini App.
 *
 * Usage:
 *   <SomeIcon strokeWidth={ICON_STROKE_WIDTH} />
 *
 * For 24px+ decorative icons where bolder presence is desired, use
 * `ICON_STROKE_WIDTH_BOLD` (2.0) instead.
 */
export const ICON_STROKE_WIDTH = 1.75;

/** Bolder variant for large decorative icons (24px+) */
export const ICON_STROKE_WIDTH_BOLD = 2.0;

/** Lighter variant for inline text icons (14-16px) */
export const ICON_STROKE_WIDTH_LIGHT = 1.5;

/**
 * Standard icon size presets (px → Tailwind class mapping).
 * Use these for consistent icon sizing across the app.
 */
export const ICON_SIZE = {
  /** Inline with body text (14-16px) — e.g. badges, tags */
  xs: "w-3.5 h-3.5",
  /** Standard UI icon (16-18px) — e.g. buttons, list items */
  sm: "w-4 h-4",
  /** Default icon (20px) — e.g. nav items, card actions */
  md: "w-5 h-5",
  /** Large icon (24px) — e.g. empty states, hero */
  lg: "w-6 h-6",
  /** Extra large (32px) — e.g. feature icons, album art placeholders */
  xl: "w-8 h-8",
} as const;

/**
 * Combined icon props helper — applies standardized size + stroke to a lucide icon.
 *
 * @example
 * <Music {...iconProps.md} />
 * // equivalent to: <Music className="w-5 h-5" strokeWidth={1.75} />
 */
export const iconProps = {
  xs: { className: ICON_SIZE.xs, strokeWidth: ICON_STROKE_WIDTH_LIGHT },
  sm: { className: ICON_SIZE.sm, strokeWidth: ICON_STROKE_WIDTH },
  md: { className: ICON_SIZE.md, strokeWidth: ICON_STROKE_WIDTH },
  lg: { className: ICON_SIZE.lg, strokeWidth: ICON_STROKE_WIDTH_BOLD },
  xl: { className: ICON_SIZE.xl, strokeWidth: ICON_STROKE_WIDTH_BOLD },
} as const;

// ============================================
// Navigation & Layout Icons
// ============================================
export {
  Home,
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  MoreVertical,
  ExternalLink,
  Link,
  LogOut,
  LogIn,
  Settings,
  User,
  Users,
  Grid3x3,
  List,
  Layers,
  LayoutGrid,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  Maximize,
  Minimize,
  Maximize2,
  Minimize2,
  Expand,
} from "lucide-react";

// ============================================
// Media & Audio Icons
// ============================================
export {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  Music,
  Music2,
  Music3,
  Music4,
  Mic,
  Mic2,
  MicVocal,
  MicOff,
  Headphones,
  Radio,
  Disc,
  Disc2,
  Disc3,
  Film,
  AudioLines,
  AudioWaveform,
  ListMusic,
  PlayCircle,
  PauseCircle,
  StopCircle,
  CirclePlay,
  CirclePause,
  CircleStop,
} from "lucide-react";

// ============================================
// Action Icons
// ============================================
export {
  Plus,
  Minus,
  Check,
  Circle,
  Square,
  Trash,
  Trash2,
  Eraser,
  CornerDownLeft,
  Edit,
  Edit2,
  Edit3,
  Pencil,
  PenLine,
  Copy,
  Clipboard,
  ClipboardCopy,
  ClipboardCheck,
  Save,
  Download,
  Upload,
  Share,
  Share2,
  Send,
  Reply,
  Forward,
  Undo,
  Undo2,
  Redo,
  Redo2,
  RotateCw,
  RotateCcw,
  RefreshCw,
  RefreshCcw,
  Scissors,
  Crop,
  Move,
  GripVertical,
  GripHorizontal,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Pin,
  PinOff,
} from "lucide-react";

// ============================================
// Status & Feedback Icons
// ============================================
export {
  Loader2,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  Bell,
  BellRing,
  BellOff,
  Clock,
  Timer,
  TimerOff,
  Calendar,
  CalendarDays,
  Star,
  StarOff,
  Heart,
  HeartOff,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Award,
  Trophy,
  Target,
  Medal,
  Crown,
  Zap,
  ZapOff,
  Sparkles,
  PartyPopper,
  Flame,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart,
  BarChart2,
  BarChart3,
  PieChart,
  LineChart,
} from "lucide-react";

// ============================================
// Content & Data Icons
// ============================================
export {
  FileText,
  File,
  FileAudio,
  FileAudio2,
  FileMusic,
  FileImage,
  FileVideo,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  Archive,
  Package,
  Box,
  Database,
  HardDrive,
  Tag,
  Tags,
  Hash,
  AtSign,
  Bookmark,
  BookmarkPlus,
  Lightbulb,
  Palette,
  Wand,
  Wand2,
  Sparkle,
  Image,
  ImagePlus,
  ImageOff,
  ImageIcon,
  Camera,
  CameraOff,
  Video,
  VideoOff,
  Type,
  Text,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  BookOpen,
  Book,
} from "lucide-react";

// ============================================
// Social & Communication Icons
// ============================================
export {
  MessageSquare,
  MessageCircle,
  MessagesSquare,
  Mail,
  MailOpen,
  Inbox,
  Instagram,
  Globe,
  Globe2,
  Link2,
  Unlink,
  UserPlus,
  UserMinus,
  UserX,
  UserCheck,
  UserCog,
  Users2,
  UsersRound,
  Contact,
  Contact2,
  PersonStanding,
} from "lucide-react";

// ============================================
// Music Production / Studio Icons
// ============================================
export {
  Piano,
  Guitar,
  Drum,
  Keyboard,
  FlaskConical,
  FileSliders,
  Sliders,
  SlidersVertical,
  Gauge,
  Waves,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  SignalZero,
  Power,
  PowerOff,
  ToggleLeft,
  ToggleRight,
  Dot,
  Circle as CircleIcon,
  CircleDot,
  CircleDotDashed,
  Hash as HashIcon,
  Binary,
} from "lucide-react";

// ============================================
// Utility / Misc Icons
// ============================================
export {
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Cloud,
  CloudOff,
  CloudUpload,
  CloudDownload,
  Wifi,
  WifiOff,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Tv,
  Tv2,
  Cast,
  QrCode,
  Fingerprint,
  Shield,
  ShieldCheck,
  ShieldOff,
  ShieldAlert,
  Key,
  KeyRound,
  Wallet,
  CreditCard,
  DollarSign,
  Euro,
  Coins,
  Gift,
  ShoppingCart,
  ShoppingBag,
  Store,
  Rocket,
  Terminal,
  Code,
  Code2,
  Braces,
  Brackets,
  CircuitBoard,
  Cpu,
  MemoryStick,
  Webhook,
  Smile,
  Frown,
  Mountain,
  Wind,
} from "lucide-react";

// ============================================
// Library / Collection Icons (for Library page)
// ============================================
export {
  Library,
  Album,
  ListPlus,
  ListMinus,
  ListOrdered,
  ListFilter,
  ListChecks,
  ListX,
  LayoutList,
  Rows3,
  Columns3,
  LayoutDashboard,
  PanelLeft,
  PanelLeftClose,
  PanelRight,
  PanelTop,
  PanelBottom,
  SidebarClose,
  SidebarOpen,
  Sidebar,
  Split,
  Merge,
  GitBranch,
  GitFork,
  GitMerge,
  History,
  Clock3,
  Clock4,
  Clock8,
  Clock12,
  Hourglass,
  AlarmClock,
  Gem,
  FolderKanban,
  Bug,
  Infinity,
  AlertOctagon,
  ArrowDownRight,
  ArrowLeftRight,
  ArrowRightFromLine,
  ArrowUpRight,
  BadgeCheck,
  Ban,
  BookmarkCheck,
  Bot,
  Brain,
  BrainCircuit,
  Calculator,
  CheckCheck,
  ChevronsLeftRight,
  Command,
  CornerDownRight,
  Droplet,
  FileCheck,
  FileCode,
  FileCode2,
  FileEdit,
  FileQuestion,
  GitCompare,
  GraduationCap,
  Grid3X3,
  Hammer,
  HeadphonesIcon,
  Languages,
  Layout,
  Layers2,
  Leaf,
  ListEnd,
  Magnet,
  Megaphone,
  MessageSquarePlus,
  MousePointer,
  MousePointer2,
  MousePointerClick,
  Network,
  PenTool,
  Percent,
  PictureInPicture2,
  PlaySquare,
  PlusCircle,
  Pointer,
  Receipt,
  RectangleVertical,
  Replace,
  Route,
  Scan,
  Server,
  Settings2,
  StickyNote,
  Telescope,
  TestTube,
  Twitter,
  Youtube,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
