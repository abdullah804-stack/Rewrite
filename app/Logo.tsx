import Image from "next/image";
import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 group ${className}`}>
      <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-sm group-hover:scale-105 transition-transform bg-white border border-surface-border">
        <Image
          src="/logo.png"
          alt="Rewrite Logo"
          fill
          className="object-cover"
          sizes="32px"
          priority
        />
      </div>
      <span className="text-lg font-bold tracking-tight text-text-primary">
        Rewrite
      </span>
    </Link>
  );
}