import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader
        rightContent={
          <>
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gtc-dark transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-1.5 text-sm font-semibold bg-gtc-green text-white rounded-lg hover:bg-gtc-green-dark transition-colors"
            >
              Get started
            </Link>
          </>
        }
      />

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="max-w-3xl text-center">
          <div className="inline-block px-3 py-1 mb-6 text-xs font-semibold text-gtc-green bg-gtc-green/10 rounded-full border border-gtc-green/20">
            SEO analysis made simple
          </div>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
            Know your SEO status
            <br />
            <span className="text-gtc-green">before you launch</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Run instant SEO audits on any URL. Check titles, headings, alt tags,
            indexability, and more — plus create your own custom checks like verifying
            your GTM tag is present.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="px-6 py-3 text-white font-semibold rounded-lg transition-colors"
              style={{ background: "linear-gradient(135deg, #4D5958 0%, #374241 100%)" }}
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
              <div key={f.title} className="p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
