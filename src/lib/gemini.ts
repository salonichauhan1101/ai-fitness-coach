import { GoogleGenerativeAI } from '@google/generative-ai'

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

        export async function estimateCaloriesFromImage(base64Image: string, mimeType: string) {
        const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' })

        const prompt = `You are a nutrition expert. Look at this meal photo and estimate its nutritional content.

        Respond ONLY with valid JSON in this exact format, no markdown, no backticks, no extra text:
        {
        "food_name": "short description of the meal",
        "calories": estimated_number,
        "protein_g": estimated_number,
        "carbs_g": estimated_number,
        "fat_g": estimated_number
        }`

        const result = await model.generateContent([
        prompt,
        {
        inlineData: {
        data: base64Image,
        mimeType: mimeType,
        },
        },
        ])

        const responseText = result.response.text()
        const cleaned = responseText.replace(/```json|```/g, '').trim()

        return JSON.parse(cleaned)
        }