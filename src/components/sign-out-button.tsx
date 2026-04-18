"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-sm text-white/70 hover:text-white font-medium transition-colors"
    >
      Sign out
    </button>
  );
}
