import { DashboardSkeleton } from '@/components/skeletons'

export default function DashboardLoading() {
  return (
    <div className="px-4 lg:px-6 py-4">
      <DashboardSkeleton />
    </div>
  )
}
