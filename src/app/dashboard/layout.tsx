import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-gray-200 bg-white p-6">
        <h1 className="mb-8 font-display text-lg font-bold">AI Fitness Coach</h1>
        <nav className="space-y-1">
          <Link href="/dashboard" className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100">
            Overview
          </Link>
          <Link href="/dashboard/meals" className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100">
            Meals
          </Link>
          <Link href="/dashboard/workouts" className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100">
            Workouts
          </Link>
          <Link href="/dashboard/habits" className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100">
            Habits
          </Link>
          <Link href="/dashboard/form-check" className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100">
            Form Check
          </Link>
        </nav>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  )
}