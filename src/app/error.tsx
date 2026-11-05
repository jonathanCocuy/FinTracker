"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 text-center max-w-xs">
          <p className="text-7xl font-bold text-zinc-700">500</p>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
            <p className="text-sm text-zinc-400">
              An unexpected error occurred. Try again or go back to the dashboard.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="px-5 py-2.5 rounded-xl bg-zinc-700 text-sm font-semibold hover:bg-zinc-600 transition-colors"
            >
              Try again
            </button>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-sm font-semibold hover:bg-indigo-500 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
