"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react'

// Dynamically import PDF.js only on client side
const usePDFJS = () => {
  const [pdfjsLib, setPdfjsLib] = useState<any>(null)

  useEffect(() => {
    const loadPDFJS = async () => {
      try {
        const pdfjs = await import('pdfjs-dist')
        
        // Use the CORRECT URL that actually exists - no legacy folder for v5.3.31
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.mjs`
        
        console.log('✅ PDF.js loaded successfully WITH jsDelivr worker')
        setPdfjsLib(pdfjs)
      } catch (error) {
        console.error('❌ Failed to load PDF.js:', error)
      }
    }

    loadPDFJS()
  }, [])

  return pdfjsLib
}

interface PDFViewerProps {
  url: string
  currentPage: number
  onPageCountChange: (totalPages: number) => void
  onPageRender?: () => void
  className?: string
  style?: React.CSSProperties
}

export function PDFViewer({ 
  url, 
  currentPage, 
  onPageCountChange, 
  onPageRender,
  className = "",
  style = {}
}: PDFViewerProps) {
  const pdfjsLib = usePDFJS()
  const [pdfDocument, setPdfDocument] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isRenderingRef = useRef(false)
  const currentRenderTaskRef = useRef<any>(null)

  // Memoize onPageCountChange to prevent unnecessary re-renders
  const stableOnPageCountChange = useCallback((totalPages: number) => {
    onPageCountChange(totalPages)
  }, [onPageCountChange])

  // Memoize onPageRender to prevent unnecessary re-renders
  const stableOnPageRender = useCallback(() => {
    onPageRender?.()
  }, [onPageRender])

  // Load PDF document
  const loadPDF = useCallback(async () => {
    if (!pdfjsLib || !url) {
      console.log('⏸️ Skipping PDF load - PDF.js not ready or no URL')
      return
    }

    try {
      console.log('📄 Starting PDF load from URL:', url)
      setIsLoading(true)
      setError(null)
      
      const loadingTask = pdfjsLib.getDocument(url)
      const pdf = await loadingTask.promise
      
      console.log('✅ PDF loaded successfully, pages:', pdf.numPages)
      setPdfDocument(pdf)
      stableOnPageCountChange(pdf.numPages)
    } catch (err) {
      console.error('❌ Error loading PDF:', err)
      console.error('❌ Failed URL:', url)
      setError('Failed to load PDF document')
    } finally {
      setIsLoading(false)
    }
  }, [url, pdfjsLib, stableOnPageCountChange])

  // Render specific page
  const renderPage = useCallback(async () => {
    console.log(`🎨 renderPage called for page ${currentPage + 1}`)
    
    if (!pdfDocument) {
      console.log('⏸️ Skipping page render - no PDF document')
      return
    }

    // Prevent concurrent rendering
    if (isRenderingRef.current) {
      console.log('⏸️ Skipping page render - already rendering')
      return
    }

    // Set rendering flag
    isRenderingRef.current = true

    // Cancel any current render operation
    if (currentRenderTaskRef.current) {
      console.log('🛑 Canceling previous render task')
      currentRenderTaskRef.current.cancel()
      currentRenderTaskRef.current = null
    }

    // Wait a moment to ensure canvas is properly mounted and any previous operation is fully cancelled
    await new Promise(resolve => setTimeout(resolve, 100))
    
    if (!canvasRef.current) {
      console.log('⏸️ Skipping page render - canvas not available after delay')
      isRenderingRef.current = false
      return
    }

    try {
      const page = await pdfDocument.getPage(currentPage + 1) // PDF.js uses 1-indexed pages
      const canvas = canvasRef.current
      
      // Triple-check canvas is still available (race condition protection)
      if (!canvas || !canvas.getContext) {
        console.log('⏸️ Canvas became null or invalid during render')
        isRenderingRef.current = false
        return
      }
      
      const context = canvas.getContext('2d')
      
      if (!context) {
        console.log('⏸️ Could not get 2D context from canvas')
        isRenderingRef.current = false
        return
      }

      // Calculate scale for better quality - make it wider (900px instead of 612px)
      const viewport = page.getViewport({ scale: 1 })
      const targetWidth = 900 // Increased from 612px for better quality
      const scale = targetWidth / viewport.width
      
      // Apply device pixel ratio for crisp rendering on high-DPI displays
      const devicePixelRatio = window.devicePixelRatio || 1
      const scaledViewport = page.getViewport({ scale: scale * devicePixelRatio })

      // Set canvas dimensions (actual size for high-DPI)
      canvas.height = scaledViewport.height
      canvas.width = scaledViewport.width

      // Set display size (CSS size)
      canvas.style.width = `${targetWidth}px`
      canvas.style.height = `${scaledViewport.height / devicePixelRatio}px`

      // Scale the context for high-DPI rendering
      if (devicePixelRatio !== 1) {
        context.scale(devicePixelRatio, devicePixelRatio)
      }

      // Update parent container height to match canvas display size
      const parentDiv = canvas.parentElement
      if (parentDiv) {
        parentDiv.style.height = `${scaledViewport.height / devicePixelRatio}px`
        parentDiv.style.width = `${targetWidth}px`
      }

      // Render page
      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
      }

      const renderTask = page.render(renderContext)
      currentRenderTaskRef.current = renderTask
      
      await renderTask.promise
      currentRenderTaskRef.current = null
      isRenderingRef.current = false
      console.log(`✅ Page ${currentPage + 1} rendered successfully`)
      stableOnPageRender()
    } catch (err) {
      if (err && typeof err === 'object' && 'name' in err && err.name === 'RenderingCancelledException') {
        console.log('⏸️ Render task was cancelled')
      } else {
        console.error('Error rendering page:', err)
        setError('Failed to render page')
      }
      currentRenderTaskRef.current = null
      isRenderingRef.current = false
    }
  }, [pdfDocument, currentPage, stableOnPageRender])

  // Load PDF when URL changes and PDF.js is available
  useEffect(() => {
    if (pdfjsLib && url) {
      console.log('🔄 PDF loading triggered by URL or PDF.js change')
      loadPDF()
    }
  }, [url, pdfjsLib, loadPDF])

  // Render page when document or current page changes
  useEffect(() => {
    if (pdfDocument && !isRenderingRef.current) {
      console.log('🎨 Page rendering triggered by document or page change')
      renderPage()
    }
  }, [pdfDocument, currentPage, renderPage])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentRenderTaskRef.current) {
        currentRenderTaskRef.current.cancel()
        currentRenderTaskRef.current = null
      }
      isRenderingRef.current = false
    }
  }, [])

  if (!pdfjsLib || isLoading) {
    return (
      <div 
        className={`relative flex items-center justify-center bg-gray-100 ${className}`} 
        style={{ minHeight: '800px', ...style }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">
            {!pdfjsLib ? 'Loading PDF viewer...' : 'Loading PDF...'}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div 
        className={`relative flex items-center justify-center bg-gray-100 ${className}`} 
        style={{ minHeight: '800px', ...style }}
      >
        <div className="text-center text-red-600">
          <p className="font-medium">Error loading PDF</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={style}>
      <canvas
        ref={canvasRef}
        className="shadow-lg border border-gray-300 bg-white pointer-events-none"
        style={{ 
          display: 'block',
          margin: '0 auto' // Center the canvas
        }}
      />
    </div>
  )
} 