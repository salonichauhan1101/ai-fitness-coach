import Link from 'next/link'
import { LayoutDashboard, Flame, Dumbbell, ListChecks, Camera } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/meals', label: 'Meals', icon: Flame },
  { href: '/dashboard/workouts', label: 'Workouts', icon: Dumbbell },
  { href: '/dashboard/habits', label: 'Habits', icon: ListChecks },
  { href: '/dashboard/form-check', label: 'Form', icon: Camera },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden w-56 border-r border-gray-200 bg-white p-6 md:block">
        <h1 className="mb-8 font-display text-lg font-bold">AI Fitness Coach</h1>
        <nav className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile top header — hidden on desktop */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <h1 className="font-display text-base font-bold">AI Fitness Coach</h1>
      </header>

      {/* Main content — bottom padding on mobile so content isn't hidden behind the tab bar */}
      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* Mobile bottom tab bar — hidden on desktop */}
      <nav className="fixed bottom-0 left-0 right-0 flex border-t border-gray-200 bg-white md:hidden">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center gap-1 py-2 text-xs text-gray-600"
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  )
}