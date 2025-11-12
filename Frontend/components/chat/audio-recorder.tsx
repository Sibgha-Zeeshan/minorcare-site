"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"

interface AudioRecorderProps {
  onUpload: (audioBlob: Blob) => void
  disabled?: boolean
}

export default function AudioRecorder({ onUpload, disabled = false }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" })
        onUpload(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
    } catch (err) {
      console.error("Error accessing microphone:", err)
      alert("Please allow microphone access to record audio")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  return (
    <div className="flex gap-2">
      {!isRecording ? (
        <Button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          variant="outline"
          className="rounded-lg bg-transparent"
        >
          🎤 Record
        </Button>
      ) : (
        <>
          <Button type="button" onClick={stopRecording} variant="destructive" className="rounded-lg">
            Stop
          </Button>
          <span className="flex items-center gap-2 text-sm text-red-600">
            <span className="inline-block w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
            Recording...
          </span>
        </>
      )}
    </div>
  )
}
