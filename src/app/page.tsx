import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="font-bold text-xl text-green-600">SEO Preflight</span>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="max-w-3xl text-center">
          <div className="inline-block px-3 py-1 mb-6 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
            SEO analysis made simple
          </div>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
            Know your SEO status
            <br />
            <span className="text-green-600">before you launch</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Run instant SEO audits on any URL. Check titles, headings, alt tags,
            indexability, and more — plus create your own custom checks like verifying
            your GTM tag is present.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-t border-gray-200 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">
            Everything you need to audit SEO
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Built-in SEO checks",
                desc: "Title tags, meta descriptions, heading structure, alt tags, canonical, Open Graph, robots.txt, HTTPS, and more.",
              },
              {
                title: "Custom checks",
                desc: "Define your own checks — verify your GTM tag is present, a tracking pixel exists, or any HTML pattern you need.",
              },
              {
                title: "Multiple profiles",
                desc: "Manage multiple websites in one place. Track analysis history and spot regressions over time.",
              },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
