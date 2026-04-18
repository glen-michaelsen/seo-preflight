import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/sign-out-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-green-600">
            SEO Preflight
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">{children}</main>
    </div>
  );
}
