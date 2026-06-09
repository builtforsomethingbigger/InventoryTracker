"use client";

import { signIn } from "next-auth/react";
import { Providers } from "@/components/Providers";

export default function LoginPage() {
  return (
    <Providers>
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Inventory Tracker
          </h1>
          <p className="mt-2 text-sm text-muted">
            Sign in with Google to manage your inventory and sales.
          </p>
          <button
            onClick={() => signIn("google", { callbackUrl: "/setup" })}
            className="mt-8 w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </Providers>
  );
}
