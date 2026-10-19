import Image from "next/image";
import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 group ${className}`}>
      <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-brand-600 shadow-sm group-hover:scale-105 transition-transform">
        <Image
          src="/logo.png"
          alt="Rewrite Logo"
          fill
          className="object-contain p-1"
          sizes="32px"
          priority
        />
      </div>
      <span className="text-lg font-bold tracking-tight text-text-primary dark:text-white">
        Rewrite
      </span>
    </Link>
  );
}