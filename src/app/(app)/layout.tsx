import { Navbar } from '@/src/components/navbar'
import { PwaRegister } from '@/src/components/pwa-register'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PwaRegister />
      <Navbar />
      <div className="max-w-7xl mx-auto w-full px-4 py-6">
        {children}
      </div>
    </>
  )
}
