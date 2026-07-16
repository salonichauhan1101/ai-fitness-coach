'use client'

import { useEffect, useRef, useState } from 'react'
import { FilesetResolver, PoseLandmarker, DrawingUtils } from '@mediapipe/tasks-vision'

type Point = { x: number; y: number }

function calculateAngle(a: Point, b: Point, c: Point) {
  // b is the vertex (the knee) — angle between vectors b→a and b→c
  const vectorBA = { x: a.x - b.x, y: a.y - b.y }
  const vectorBC = { x: c.x - b.x, y: c.y - b.y }

  const dotProduct = vectorBA.x * vectorBC.x + vectorBA.y * vectorBC.y
  const magnitudeBA = Math.sqrt(vectorBA.x ** 2 + vectorBA.y ** 2)
  const magnitudeBC = Math.sqrt(vectorBC.x ** 2 + vectorBC.y ** 2)

  const cosAngle = dotProduct / (magnitudeBA * magnitudeBC)
  const angleRadians = Math.acos(Math.min(1, Math.max(-1, cosAngle)))
  return (angleRadians * 180) / Math.PI
}

function getSquatFeedback(kneeAngle: number) {
  if (kneeAngle > 160) return { label: 'Stand ready', color: 'var(--color-zone-blue)' }
  if (kneeAngle > 100) return { label: 'Descending — keep going', color: 'var(--color-zone-amber)' }
  return { label: 'Good depth!', color: 'var(--color-zone-coral)' }
}

export default function FormCheckPage() {
const [kneeAngle, setKneeAngle] = useState<number | null>(null)
const [feedback, setFeedback] = useState<{ label: string; color: string } | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState('Loading pose detection model...')

  useEffect(() => {
    let poseLandmarker: PoseLandmarker | null = null
    let animationFrameId: number
    let stream: MediaStream | null = null
    let cancelled = false

    const setup = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )

      if (cancelled) return

      poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      })

      if (cancelled) {
        poseLandmarker?.close()
        return
      }

      setStatus('Requesting camera access...')

      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      })

      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
        } catch {
          // Ignore abort errors from React Strict Mode's double-invoke in dev
          return
        }
        if (!cancelled) {
          setStatus('')
          detectLoop()
        }
      }
    }

    const detectLoop = () => {
      if (cancelled) return
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || !poseLandmarker) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const result = poseLandmarker.detectForVideo(video, performance.now())

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const drawingUtils = new DrawingUtils(ctx)
      for (const landmarks of result.landmarks) {
        drawingUtils.drawLandmarks(landmarks, { radius: 4 })
        drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS)
      }

      animationFrameId = requestAnimationFrame(detectLoop)
      const landmarks = result.landmarks[0]
      if (landmarks) {
        const hip = landmarks[23]
        const knee = landmarks[25]
        const ankle = landmarks[27]

        // Only calculate if MediaPipe is confident it can see all three points
        if (
          hip.visibility! > 0.5 &&
          knee.visibility! > 0.5 &&
          ankle.visibility! > 0.5
        ) {
          const angle = calculateAngle(hip, knee, ankle)
          setKneeAngle(angle)
          setFeedback(getSquatFeedback(angle))
        }
      }
    }

    setup().catch((err) => {
      if (!cancelled) {
        console.error(err)
        setStatus('Could not access camera or load model. Check permissions.')
      }
    })

    return () => {
      cancelled = true
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      if (stream) stream.getTracks().forEach((track) => track.stop())
      poseLandmarker?.close()
    }
  }, [])

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <h1 className="mb-1 font-display text-2xl font-bold">Form Check</h1>
      <p className="mb-6 text-sm text-gray-500">
        Position yourself in frame, then perform your exercise.
      </p>

      <div
        className="relative overflow-hidden rounded-lg bg-black shadow-sm"
        style={{ aspectRatio: '4 / 3' }}
      >
        <video ref={videoRef} className="hidden" playsInline muted />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />

        {status && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <p className="text-sm text-white">{status}</p>
          </div>
        )}
      </div>

      {feedback && kneeAngle !== null && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
          <p className="font-medium" style={{ color: feedback.color }}>
            {feedback.label}
          </p>
          <p className="readout text-lg" style={{ color: feedback.color }}>
            {Math.round(kneeAngle)}°
          </p>
        </div>
      )}
    </div>
  )
}