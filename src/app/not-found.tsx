import Link from "next/link"

export default function NotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 text-center max-w-xs">
          <p className="text-7xl font-bold text-zinc-700">404</p>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-semibold tracking-tight">Page not found</h1>
            <p className="text-sm text-zinc-400">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-sm font-semibold hover:bg-indigo-500 transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      </body>
    </html>
  )
}
