import {
  Image,
  Type,
  Zap,
  FileText,
  Search,
  Lightbulb,
  Scissors,
  Clapperboard,
  Crosshair,
  UserCircle,
  Layout,
  AtSign,
  Hash,
  Compass,
  Film,
  Video,
  Camera,
  TrendingUp,
  Wand2,
  BarChart3,
  Mic,
  Eraser,
  Captions,
  Repeat2,
  MessageSquare,
  CalendarDays,
  Mail,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Image,
  Type,
  Zap,
  FileText,
  Search,
  Lightbulb,
  Scissors,
  Clapperboard,
  Crosshair,
  UserCircle,
  Layout,
  AtSign,
  Hash,
  Compass,
  Film,
  Video,
  Camera,
  TrendingUp,
  Wand2,
  BarChart3,
  Mic,
  Eraser,
  Captions,
  Repeat2,
  MessageSquare,
  CalendarDays,
  Mail,
};

export function ToolIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Cmp = ICONS[name] ?? Zap;
  return <Cmp className={className} />;
}
