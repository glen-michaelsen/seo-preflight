import Link from "next/link";
import Image from "next/image";

interface SiteHeaderProps {
  rightContent?: React.ReactNode;
}

export default function SiteHeader({ rightContent }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/assets/gtc-symbol.svg"
            alt="Glen's Tech Corner"
            width={32}
            height={32}
            className="rounded-full"
          />
          <span className="font-semibold text-gtc-dark text-base tracking-tight">
            SEO Preflight
          </span>
        </Link>
        {rightContent && (
          <div className="flex items-center gap-4">{rightContent}</div>
        )}
      </div>
    </header>
  );
}
