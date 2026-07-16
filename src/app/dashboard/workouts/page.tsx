'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Workout = {
  id: string
  exercise_name: string
  sets: number
  reps: number
  weight_kg: number
  completed: boolean
  scheduled_date: string
}

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [exerciseName, setExerciseName] = useState('')
  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState(10)
  const [weight, setWeight] = useState(0)

  const fetchWorkouts = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_date', { ascending: false })

    setWorkouts(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchWorkouts()
  }, [])

  // Progression logic: suggest next weight based on the last completed session
  // of the same exercise. If they hit their target reps, suggest +2.5kg.
  const getSuggestion = (exerciseName: string) => {
    const pastSessions = workouts
      .filter((w) => w.exercise_name.toLowerCase() === exerciseName.toLowerCase() && w.completed)
      .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())

    if (pastSessions.length === 0) return null

    const last = pastSessions[0]
    return {
      suggestedWeight: last.weight_kg + 2.5,
      basedOn: last,
    }
  }

  const handleAddWorkout = async (e: React.FormEvent) => {
    e.preventDefault()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('workouts').insert({
      user_id: user.id,
      exercise_name: exerciseName,
      sets,
      reps,
      weight_kg: weight,
    })

    setExerciseName('')
    setSets(3)
    setReps(10)
    setWeight(0)
    fetchWorkouts()
  }

  const toggleComplete = async (id: string, completed: boolean) => {
    await supabase.from('workouts').update({ completed: !completed }).eq('id', id)
    fetchWorkouts()
  }

  const suggestion = exerciseName ? getSuggestion(exerciseName) : null

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <h1 className="mb-6 text-2xl font-bold">Workout Planner</h1>

      <form onSubmit={handleAddWorkout} className="mb-8 space-y-3 rounded-lg bg-gray-50 p-4">
        <input
          type="text"
          placeholder="Exercise name (e.g. Squat)"
          value={exerciseName}
          onChange={(e) => setExerciseName(e.target.value)}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        />

        {suggestion && (
          <p className="text-sm">
            Last time:{' '}
            <span className="readout" style={{ color: 'var(--color-zone-blue)' }}>
              {suggestion.basedOn.weight_kg}kg × {suggestion.basedOn.reps}
            </span>
            {' '}→ Suggested next:{' '}
            <span className="readout font-semibold" style={{ color: 'var(--color-zone-amber)' }}>
              {suggestion.suggestedWeight}kg
            </span>
          </p>
        )}

        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Sets"
            value={sets}
            onChange={(e) => setSets(Number(e.target.value))}
            className="w-1/3 rounded-md border border-gray-300 px-3 py-2"
          />
          <input
            type="number"
            placeholder="Reps"
            value={reps}
            onChange={(e) => setReps(Number(e.target.value))}
            className="w-1/3 rounded-md border border-gray-300 px-3 py-2"
          />
          <input
            type="number"
            placeholder="Weight (kg)"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            step="0.5"
            className="w-1/3 rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <button type="submit" className="w-full rounded-md bg-black py-2 text-white">
          Add workout
        </button>
      </form>

      <h2 className="mb-3 text-lg font-semibold">Your workouts</h2>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : workouts.length === 0 ? (
        <p className="text-gray-500">No workouts logged yet.</p>
      ) : (
        <ul className="space-y-2">
          {workouts.map((w) => (
            <li
              key={w.id}
              className="flex items-center justify-between rounded-md bg-gray-50 p-3"
            >
              <div>
                <p className={`font-medium ${w.completed ? 'line-through text-gray-400' : ''}`}>
                  {w.exercise_name}
                </p>
                <p className="readout text-sm text-gray-600">
                  {w.sets} × {w.reps} <span style={{ color: 'var(--color-zone-blue)' }}>@ {w.weight_kg}kg</span>
                </p>
                <p className="text-xs text-gray-400">{w.scheduled_date}</p>
              </div>
              <button
                onClick={() => toggleComplete(w.id, w.completed)}
                className={`rounded-md px-3 py-1 text-sm ${
                  w.completed ? 'bg-gray-200 text-gray-600' : 'bg-green-600 text-white'
                }`}
              >
                {w.completed ? 'Undo' : 'Done'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}