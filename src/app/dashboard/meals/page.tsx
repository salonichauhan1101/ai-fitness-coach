'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type MealResult = {
  food_name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export default function MealsPage() {
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MealResult | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        resolve({ base64, mimeType: file.type })
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setResult(null)
    setSaved(false)
    setPreview(URL.createObjectURL(file))
    setLoading(true)

    try {
      const { base64, mimeType } = await fileToBase64(file)

      const res = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image: base64, mimeType }),
      })

      if (!res.ok) throw new Error('Analysis failed')

      const data: MealResult = await res.json()
      setResult(data)

      // Upload image to Supabase storage
      //const fileName = `${Date.now()}-${file.name}`
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '-')
      const fileName = `${Date.now()}-${sanitizedName}`
      const { error: uploadError } = await supabase.storage
        .from('meal-photos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('meal-photos')
        .getPublicUrl(fileName)

      // Save to meals table
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not logged in')

      const { error: insertError } = await supabase.from('meals').insert({
        user_id: user.id,
        image_url: urlData.publicUrl,
        food_name: data.food_name,
        calories: data.calories,
        protein_g: data.protein_g,
        carbs_g: data.carbs_g,
        fat_g: data.fat_g,
      })

      if (insertError) throw insertError

      setSaved(true)
    } catch (err) {
      console.error(err)
      setError('Something went wrong analyzing or saving this meal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-2xl font-bold">Log a meal</h1>

      <label className="block cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <span className="text-gray-500">Tap to take or choose a photo</span>
      </label>

      {preview && (
        <img
          src={preview}
          alt="Meal preview"
          className="mt-4 w-full rounded-lg object-cover"
        />
      )}

      {loading && <p className="mt-4 text-gray-500">Analyzing your meal...</p>}

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {result && (
        <div className="mt-4 space-y-1 rounded-lg bg-gray-50 p-4">
          <p className="font-semibold">{result.food_name}</p>
          <p>Calories: {result.calories}</p>
          <p>Protein: {result.protein_g}g</p>
          <p>Carbs: {result.carbs_g}g</p>
          <p>Fat: {result.fat_g}g</p>
          {saved && <p className="text-sm text-green-600">✓ Saved to your log</p>}
        </div>
      )}
    </div>
  )
}