'use client'

import { useEffect, useRef, useState } from 'react'
import { FilesetResolver, PoseLandmarker, DrawingUtils } from '@mediapipe/tasks-vision'

export default function FormCheckPage() {
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
    <div className="mx-auto max-w-2xl p-8">
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
    </div>
  )
}