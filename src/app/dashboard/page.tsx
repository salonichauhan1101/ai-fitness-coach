'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

type Meal = {
  id: string
  food_name: string
  calories: number
  created_at: string
}

type Workout = {
  id: string
  exercise_name: string
  completed: boolean
  scheduled_date: string
}

export default function DashboardPage() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: mealsData } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const { data: workoutsData } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: false })

      setMeals(mealsData || [])
      setWorkouts(workoutsData || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const today = getLocalDateString(new Date())

  const todaysCalories = meals
    .filter((m) => getLocalDateString(new Date(m.created_at)) === today)
    .reduce((sum, m) => sum + (m.calories || 0), 0)

  const todaysWorkoutsCompleted = workouts.filter(
    (w) => w.scheduled_date === today && w.completed
  ).length

  // Build last 7 days of calorie totals for the chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d
  })

  const chartData = last7Days.map((d) => {
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' })
    const dateStr = getLocalDateString(d)
    const dayTotal = meals
      .filter((m) => getLocalDateString(new Date(m.created_at)) === dateStr)
      .reduce((sum, m) => sum + (m.calories || 0), 0)
    return { day: dayLabel, calories: dayTotal }
  })

  // Combine recent meals + workouts into one activity feed
  const recentActivity = [
    ...meals.slice(0, 5).map((m) => ({
      type: 'meal' as const,
      label: m.food_name,
      detail: `${m.calories} cal`,
      time: m.created_at,
    })),
    ...workouts.slice(0, 5).map((w) => ({
      type: 'workout' as const,
      label: w.exercise_name,
      detail: w.completed ? 'Completed' : 'Planned',
      time: w.scheduled_date,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 6)

  if (loading) {
    return <div className="p-8 text-gray-500">Loading your dashboard...</div>
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="mb-1 font-display text-2xl font-bold">Overview</h1>
      <p className="mb-8 text-sm text-gray-500">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      {/* Today's snapshot */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Calories today</p>
          <p className="readout text-3xl font-semibold" style={{ color: 'var(--color-zone-amber)' }}>
            {todaysCalories}
          </p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Workouts completed today</p>
          <p className="readout text-3xl font-semibold" style={{ color: 'var(--color-zone-blue)' }}>
            {todaysWorkoutsCompleted}
          </p>
        </div>
      </div>

      {/* 7-day trend */}
      <div className="mb-8 rounded-lg bg-white p-5 shadow-sm">
        <p className="mb-4 font-display text-sm font-semibold text-gray-700">
          Calories — last 7 days
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="calories" fill="var(--color-zone-amber)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent activity */}
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <p className="mb-4 font-display text-sm font-semibold text-gray-700">Recent activity</p>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-gray-400">
            Nothing logged yet — head to Meals or Workouts to get started.
          </p>
        ) : (
          <ul className="space-y-3">
            {recentActivity.map((item, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        item.type === 'meal' ? 'var(--color-zone-amber)' : 'var(--color-zone-blue)',
                    }}
                  />
                  <span>{item.label}</span>
                </div>
                <span className="readout text-gray-500">{item.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}