import { DashboardSkeleton } from '@/components/skeletons'

// Main app route loading state - shows dashboard skeleton as default
export default function AppLoading() {
  return (
    <div className="px-4 lg:px-6 py-4">
      <DashboardSkeleton />
    </div>
  )
}
