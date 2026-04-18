import Image from "next/image";

export default function SiteFooter() {
  return (
    <footer
      style={{ background: "linear-gradient(135deg, #BF1725 0%, #830B15 100%)" }}
    >
      <div className="max-w-6xl mx-auto px-6 py-10 flex items-center justify-between flex-wrap gap-6">
        <a
          href="https://glenstechcorner.com"
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-90 hover:opacity-100 transition-opacity"
        >
          <Image
            src="/assets/gtc-full-negative.svg"
            alt="Glen's Tech Corner"
            width={240}
            height={87}
            className="h-14 w-auto"
          />
        </a>
        <p className="text-white/70 text-sm">
          Tool by{" "}
          <a
            href="https://glenstechcorner.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white font-medium hover:underline"
          >
            Glen&apos;s Tech Corner
          </a>
        </p>
      </div>
    </footer>
  );
}
