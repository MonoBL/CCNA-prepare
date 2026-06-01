import { Bookmark } from "lucide-react";
import { toggleFavorite } from "@/lib/favorites";

interface Props {
  questionId: string;
  saved: boolean;
  onToggle: (newIds: string[]) => void;
  size?: "sm" | "md";
}

export default function BookmarkButton({ questionId, saved, onToggle, size = "md" }: Props) {
  async function handle(e: React.MouseEvent) {
    e.stopPropagation();
    const next = await toggleFavorite(questionId);
    onToggle(next);
  }

  const iconSize = size === "sm" ? 13 : 15;
  const base = size === "sm"
    ? "flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors"
    : "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors";

  return (
    <button
      onClick={handle}
      aria-label={saved ? "Remove bookmark" : "Bookmark question"}
      title={saved ? "Remove bookmark" : "Save for later"}
      className={`${base} ${
        saved
          ? "border-yellow-500/60 bg-yellow-900/20 text-yellow-400 hover:bg-yellow-900/40"
          : "border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-200"
      }`}
    >
      <Bookmark size={iconSize} className={saved ? "fill-yellow-400" : ""} />
      <span>{saved ? "Saved" : "Save"}</span>
    </button>
  );
}
