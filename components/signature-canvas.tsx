"use client"

import React, { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, PenTool } from "lucide-react"

interface SignatureCanvasProps {
  width?: number
  height?: number
  penColor?: string
  penWidth?: number
  backgroundColor?: string
  onSignatureChange?: (signature: string | null) => void
  initialSignature?: string | null
  disabled?: boolean
  className?: string
}

export function SignatureCanvas({
  width = 400,
  height = 200,
  penColor = "#000000",
  penWidth = 2,
  backgroundColor = "transparent",
  onSignatureChange,
  initialSignature,
  disabled = false,
  className = ""
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setContext(ctx)

    // Set up canvas context
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = penColor
    ctx.lineWidth = penWidth

    // Set background if not transparent
    if (backgroundColor !== "transparent") {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, width, height)
    }

    // Load initial signature if provided
    if (initialSignature) {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, width, height)
        if (backgroundColor !== "transparent") {
          ctx.fillStyle = backgroundColor
          ctx.fillRect(0, 0, width, height)
        }
        ctx.drawImage(img, 0, 0)
        setIsEmpty(false)
      }
      img.src = initialSignature
    }
  }, [width, height, penColor, penWidth, backgroundColor, initialSignature])

  const getCoordinates = (event: MouseEvent | TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if (event.type.startsWith('touch')) {
      const touchEvent = event as TouchEvent
      const touch = touchEvent.touches[0] || touchEvent.changedTouches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      }
    } else {
      const mouseEvent = event as MouseEvent
      return {
        x: (mouseEvent.clientX - rect.left) * scaleX,
        y: (mouseEvent.clientY - rect.top) * scaleY
      }
    }
  }

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    if (disabled || !context) return
    
    event.preventDefault()
    setIsDrawing(true)
    
    const { x, y } = getCoordinates(event.nativeEvent)
    context.beginPath()
    context.moveTo(x, y)
  }

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled || !context) return
    
    event.preventDefault()
    const { x, y } = getCoordinates(event.nativeEvent)
    
    context.lineTo(x, y)
    context.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    
    setIsDrawing(false)
    setIsEmpty(false)
    
    // Get the signature as base64 and call onChange
    if (onSignatureChange) {
      const canvas = canvasRef.current
      if (canvas) {
        const signatureData = canvas.toDataURL("image/png")
        onSignatureChange(signatureData)
      }
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas || !context) return

    context.clearRect(0, 0, width, height)
    
    // Set background if not transparent
    if (backgroundColor !== "transparent") {
      context.fillStyle = backgroundColor
      context.fillRect(0, 0, width, height)
    }
    
    setIsEmpty(true)
    
    if (onSignatureChange) {
      onSignatureChange(null)
    }
  }

  const handleMouseDown = (event: React.MouseEvent) => startDrawing(event)
  const handleMouseMove = (event: React.MouseEvent) => draw(event)
  const handleMouseUp = () => stopDrawing()
  const handleMouseLeave = () => stopDrawing()

  const handleTouchStart = (event: React.TouchEvent) => startDrawing(event)
  const handleTouchMove = (event: React.TouchEvent) => draw(event)
  const handleTouchEnd = () => stopDrawing()

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-600">
          <PenTool className="w-4 h-4 mr-2" />
          <span>Click and drag to sign</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearSignature}
          disabled={isEmpty || disabled}
          className="h-7 px-2 text-xs"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Clear
        </Button>
      </div>
      
      <div className="relative bg-white">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={`block cursor-crosshair touch-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{ width: '100%', height: 'auto', maxHeight: `${height}px` }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        
        {isEmpty && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400">
              <PenTool className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Sign here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 