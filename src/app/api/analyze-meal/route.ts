import { NextRequest, NextResponse } from 'next/server'
        import { estimateCaloriesFromImage } from '@/lib/gemini'

        export async function POST(request: NextRequest) {
        try {
        const { base64Image, mimeType } = await request.json()

        if (!base64Image) {
        return NextResponse.json({ error: 'No image provided' }, { status: 400 })
        }

        const result = await estimateCaloriesFromImage(base64Image, mimeType)

        return NextResponse.json(result)
        } catch (error) {
        console.error('Gemini analysis error:', error)
        return NextResponse.json(
        { error: 'Failed to analyze meal photo' },
        { status: 500 }
        )
        }
        }