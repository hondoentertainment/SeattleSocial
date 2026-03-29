interface SkeletonProps {
  className?: string;
}

function Pulse({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

export function EventCardSkeleton() {
  return (
    <div className="card">
      <Pulse className="h-48 rounded-none" />
      <div className="p-5 space-y-3">
        <Pulse className="h-6 w-3/4" />
        <Pulse className="h-4 w-1/2" />
        <Pulse className="h-4 w-full" />
        <Pulse className="h-4 w-full" />
        <div className="space-y-2 pt-2">
          <Pulse className="h-4 w-2/3" />
          <Pulse className="h-4 w-1/2" />
          <Pulse className="h-4 w-1/3" />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Pulse className="h-8 w-16" />
          <Pulse className="h-10 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function EventDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Pulse className="h-5 w-32" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Pulse className="h-96 rounded-2xl" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Pulse className="h-24 rounded-xl" />
            <div className="bg-white rounded-xl shadow-md p-8 space-y-4">
              <Pulse className="h-8 w-1/3" />
              <Pulse className="h-4 w-full" />
              <Pulse className="h-4 w-full" />
              <Pulse className="h-4 w-2/3" />
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-xl p-8 space-y-4">
              <Pulse className="h-10 w-24" />
              <Pulse className="h-4 w-full" />
              <Pulse className="h-4 w-full" />
              <Pulse className="h-4 w-full" />
              <Pulse className="h-12 w-full rounded-lg" />
              <Pulse className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center space-y-4">
          <Pulse className="w-24 h-24 rounded-full" />
          <Pulse className="h-8 w-48" />
          <Pulse className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Pulse className="h-20 rounded-xl" />
          <Pulse className="h-20 rounded-xl" />
          <Pulse className="h-20 rounded-xl" />
        </div>
        <Pulse className="h-12 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      </div>
    </div>
  );
}

export default Pulse;
