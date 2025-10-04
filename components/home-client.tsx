"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

const DashboardClient = dynamic(() => import("@/components/dashboard-client"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading CleanerAir Dashboard...</p>
      </div>
    </div>
  ),
})

export default function HomeClient() {
  return (
    <main className="h-screen w-full overflow-hidden bg-background">
      <Suspense fallback={null}>
        <DashboardClient />
      </Suspense>
    </main>
  )
}
