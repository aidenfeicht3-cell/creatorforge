import {
  Image,
  Type,
  Zap,
  FileText,
  Search,
  Lightbulb,
  Scissors,
  Clapperboard,
  type LucideIcon,
} from "lucide-react";

/** Maps the icon names stored in the tool registry to Lucide components. */
const ICONS: Record<string, LucideIcon> = {
  Image,
  Type,
  Zap,
  FileText,
  Search,
  Lightbulb,
  Scissors,
  Clapperboard,
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
