"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"signUp" | "signIn">("signUp");

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <h1 className="text-xl font-semibold mb-4">
          {step === "signIn" ? "Sign in" : "Create account"}
        </h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget as HTMLFormElement);
            void signIn("password", formData);
          }}
          className="space-y-4"
        >
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            minLength={8}
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <input name="flow" type="hidden" value={step} />
          <button
            type="submit"
            className="w-full rounded-md bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            {step === "signIn" ? "Sign in" : "Sign up"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setStep(step === "signIn" ? "signUp" : "signIn")}
          className="mt-4 w-full text-sm text-zinc-400 hover:text-zinc-200"
        >
          {step === "signIn" ? "Sign up instead" : "Sign in instead"}
        </button>
        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link href="/" className="text-amber-500 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
