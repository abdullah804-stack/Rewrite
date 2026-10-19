import Image from "next/image";

export type AvatarId = "minimalist" | "storyteller" | "analyst" | "creator";

export const AVATARS: { id: AvatarId; name: string; description: string }[] = [
  { id: "minimalist", name: "The Minimalist", description: "Clean, direct, and professional." },
  { id: "storyteller", name: "The Storyteller", description: "Flowing, warm, and conversational." },
  { id: "analyst", name: "The Analyst", description: "Structured, logical, and academic." },
  { id: "creator", name: "The Creator", description: "Casual, energetic, and punchy." },
];

export function Avatar({ id, className = "w-8 h-8" }: { id: string; className?: string }) {
  const validId = ["minimalist", "storyteller", "analyst", "creator"].includes(id) 
    ? id 
    : "minimalist";

  // Define specific background colors for each persona to make them pop
  const bgColors: Record<string, string> = {
    minimalist: "bg-neutral-100 dark:bg-neutral-800",
    storyteller: "bg-orange-100 dark:bg-orange-900/30",
    analyst: "bg-blue-100 dark:bg-blue-900/30",
    creator: "bg-purple-100 dark:bg-purple-900/30",
  };

  return (
    <div className={`relative rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5 ${bgColors[validId]} ${className}`}>
      <Image
        src={`/personas/${validId}.png`}
        alt={`${validId} avatar`}
        fill
        className="object-cover object-top scale-110 pt-1"
        sizes="(max-width: 768px) 100vw, 33vw"
      />
    </div>
  );
}