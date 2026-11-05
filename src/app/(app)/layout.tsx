import { Sidebar } from '@/src/components/sidebar'
import { Topbar } from '@/src/components/topbar'
import { PwaRegister } from '@/src/components/pwa-register'
import { KeyboardShortcuts } from '@/src/components/keyboard-shortcuts'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <PwaRegister />
      <KeyboardShortcuts />

      {/* Sidebar: icon-strip on desktop, hidden on mobile */}
      <Sidebar />

      {/* Main area: offset by collapsed sidebar width on md+ */}
      <div className="flex flex-col min-h-screen md:pl-[60px]">
        <Topbar />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
