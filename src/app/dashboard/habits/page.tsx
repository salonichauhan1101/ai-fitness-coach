'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type HabitRow = {
  id: string
  habit_name: string
  completed_date: string
}

function getLocalDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Given all rows for one habit, count consecutive days backward from today
function calculateStreak(dates: string[]) {
  const dateSet = new Set(dates)
  let streak = 0
  const cursor = new Date()

  while (true) {
    const dateStr = getLocalDateString(cursor)
    if (dateSet.has(dateStr)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

export default function HabitsPage() {
  const [rows, setRows] = useState<HabitRow[]>([])
  const [newHabitName, setNewHabitName] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchHabits = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_date', { ascending: false })

    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchHabits()
  }, [])

  const today = getLocalDateString(new Date())

  // Group rows by habit name
  const habitNames = Array.from(new Set(rows.map((r) => r.habit_name)))

  const habitsWithStats = habitNames.map((name) => {
    const datesForHabit = rows.filter((r) => r.habit_name === name).map((r) => r.completed_date)
    return {
      name,
      streak: calculateStreak(datesForHabit),
      doneToday: datesForHabit.includes(today),
    }
  })

  const markDoneToday = async (habitName: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('habits').insert({
      user_id: user.id,
      habit_name: habitName,
      completed_date: today,
    })
    fetchHabits()
  }

  const undoToday = async (habitName: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('habits')
      .delete()
      .eq('user_id', user.id)
      .eq('habit_name', habitName)
      .eq('completed_date', today)
    fetchHabits()
  }

  const addNewHabit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newHabitName.trim()) return
    await markDoneToday(newHabitName.trim())
    setNewHabitName('')
  }

  if (loading) {
    return <div className="p-8 text-gray-500">Loading your habits...</div>
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <h1 className="mb-6 font-display text-2xl font-bold">Habits</h1>

      <form onSubmit={addNewHabit} className="mb-2 flex gap-2">
        <input
          type="text"
          placeholder="New habit (e.g. Drink water, Stretch)"
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-sm text-white"
        >
          Add
        </button>
      </form>
      <p className="mb-6 text-xs text-gray-400">
        Adding a habit marks it done for today. Use "Undo" if you added it by mistake.
      </p>

      {habitsWithStats.length === 0 ? (
        <p className="text-sm text-gray-400">
          No habits yet — add one above to start your first streak.
        </p>
      ) : (
        <ul className="space-y-2">
          {habitsWithStats.map((habit) => (
            <li
              key={habit.name}
              className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm"
            >
              <div>
                <p className="font-medium">{habit.name}</p>
                <p className="readout text-sm" style={{ color: 'var(--color-zone-coral)' }}>
                  {habit.streak} day{habit.streak === 1 ? '' : 's'} streak
                </p>
              </div>
              <button
                onClick={() =>
                  habit.doneToday ? undoToday(habit.name) : markDoneToday(habit.name)
                }
                className="rounded-md px-3 py-1 text-sm"
                style={{
                  backgroundColor: habit.doneToday ? '#f3f4f6' : 'var(--color-zone-coral)',
                  color: habit.doneToday ? '#6b7280' : 'white',
                }}
              >
                {habit.doneToday ? 'Undo' : 'Done'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}