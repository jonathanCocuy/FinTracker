import { WifiOff } from "lucide-react"
import Link from "next/link"

export default function OfflinePage() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 text-center max-w-xs">
          <div className="p-5 rounded-full bg-zinc-800">
            <WifiOff size={32} className="text-zinc-400" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-semibold tracking-tight">You&apos;re offline</h1>
            <p className="text-sm text-zinc-400">
              FlowX needs a connection for most features. Check your network and try again.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-sm font-semibold hover:bg-indigo-500 transition-colors"
          >
            Try again
          </Link>
        </div>
      </body>
    </html>
  )
}
