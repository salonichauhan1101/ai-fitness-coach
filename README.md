# AI Fitness Coach

A full-stack fitness tracking app that combines AI vision, real-time computer vision, and habit tracking in one clean, mobile-friendly interface. Built as a portfolio project to explore multimodal AI integration alongside more traditional full-stack patterns.

**[Live Demo](#)** · **[Tech Stack](#tech-stack)** · **[Features](#features)**

---

## Overview

AI Fitness Coach lets users log meals via photo (with AI-powered calorie/macro estimation), plan and track workouts with automatic progression suggestions, build daily habit streaks, and get real-time feedback on exercise form using their webcam — no wearables or extra hardware required.

The project was built to demonstrate two different flavors of "AI in production": a straightforward request/response AI integration (photo → Gemini Vision → structured data) and a real-time, on-device computer vision pipeline (webcam → pose detection → live geometric feedback) — two genuinely different engineering problems that happen to both fall under "AI features."

## Features

### 🍽️ Meal Logging with AI Calorie Estimation
Upload or snap a photo of your meal. Google's Gemini Vision model analyzes the image and returns an estimated food name, calorie count, and macronutrient breakdown (protein/carbs/fat), which is saved to your personal log.

### 🏋️ Workout Planner with Progression Suggestions
Log sets, reps, and weight for any exercise. The app tracks your history per exercise and suggests your next target weight based on progressive overload principles — the same logic behind most real strength programs.

### ✅ Habit Tracking with Streaks
Track daily habits (hydration, stretching, sleep, anything) and watch your streak count build day over day. Streak calculation walks backward from today, counting consecutive completed days.

### 📷 Real-Time Camera Form Analysis
Using your webcam, the app tracks 33 body landmarks in real time (via MediaPipe's pose detection model, running entirely client-side) and calculates joint angles using vector geometry to give live feedback on squat depth — no server round-trip, no video ever leaves your device.

### 📊 Personalized Dashboard
An overview page with today's stats, a 7-day calorie trend chart, and a combined activity feed — with a dedicated first-time experience for new users with no data yet.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router, TypeScript) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Database & Auth | [Supabase](https://supabase.com/) (Postgres, Row Level Security, Storage) |
| AI (vision) | [Google Gemini API](https://ai.google.dev/) (`gemini-3.1-flash-lite`) |
| Computer Vision | [MediaPipe Tasks Vision](https://developers.google.com/mediapipe) (on-device pose landmark detection) |
| Charts | [Recharts](https://recharts.org/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Hosting | [Vercel](https://vercel.com/) |

## Architecture Notes

A few decisions worth calling out, since they reflect deliberate tradeoffs rather than defaults:

- **Row Level Security (RLS)** is enforced at the database level (not just in application code) across all tables and the storage bucket, so a user can only ever read or write their own data — even if the client-side code had a bug, the database itself would refuse cross-user access.
- **Form analysis runs entirely client-side.** Rather than streaming video frames to a vision API (slow, expensive, and a privacy concern), pose detection happens in-browser using a small WASM-compiled ML model. This keeps it fast, free, and fully private.
- **Gemini is used only for the one-shot meal photo analysis**, not the real-time video feature — the right AI tool depends on the shape of the problem (single image vs. continuous stream), not just defaulting to "call the API for everything."

## Getting Started

### Prerequisites
- Node.js 20+
- A free [Supabase](https://supabase.com/) account
- A free [Google AI Studio](https://aistudio.google.com/apikey) API key (Gemini)

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-fitness-coach.git
   cd ai-fitness-coach
   npm install
   ```

2. Create a `.env.local` file in the project root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. Set up the database schema — run the SQL in [`/supabase/schema.sql`](./supabase/schema.sql) (or the SQL Editor in your Supabase dashboard) to create the `meals`, `workouts`, and `habits` tables with Row Level Security policies.

4. Create a public storage bucket named `meal-photos` in your Supabase dashboard, with insert/select policies for authenticated users.

5. Run the dev server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## Roadmap

- [ ] Expand form analysis to additional exercises beyond squats (deadlifts, push-ups)
- [ ] Weekly/monthly trend views beyond the current 7-day window
- [ ] Editable AI calorie estimates (user correction feedback loop)
- [ ] Social/sharing features for habit streaks

## License

MIT
