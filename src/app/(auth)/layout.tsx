'use client';

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (isAuthenticated) {
      router.push("/");
    }
  }, [pathname, router]);

  return (
    <main className="flex items-center justify-center h-screen w-full">
      {children}
    </main>
  );
}