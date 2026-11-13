'use client'

import { parseLabelScan, type LabelScan } from '@/components/orders/parse-label-scan'
import { Button } from '@/components/ui/Button'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export type CameraProblem = 'denied' | 'unavailable'

type Props = {
  open: boolean
  onClose: () => void
  onScanned: (scan: LabelScan) => void
  onCameraProblem: (problem: CameraProblem) => void
}

const SCAN_INTERVAL_MS = 150
const MATRIX_WAIT_MS = 400
const FRAME_INSET_X = 32
const FRAME_HEIGHT = 112

const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
}

const LINEAR_FORMATS = new Set([
  'code_128',
  'code_39',
  'code_93',
  'codabar',
  'ean_13',
  'ean_8',
  'itf',
  'upc_a',
  'upc_e',
])

const NATIVE_FORMATS = [
  ...LINEAR_FORMATS,
  'qr_code',
  'pdf417',
  'data_matrix',
  'aztec',
]

type DetectedCode = {
  rawValue: string
  format: string
}

type NativeBarcodeDetector = {
  detect: (source: CanvasImageSource) => Promise<DetectedCode[]>
}

type NativeBarcodeDetectorClass = {
  new (options: { formats: string[] }): NativeBarcodeDetector
  getSupportedFormats: () => Promise<string[]>
}

async function createNativeDetector(): Promise<NativeBarcodeDetector | null> {
  const Detector = (window as unknown as { BarcodeDetector?: NativeBarcodeDetectorClass })
    .BarcodeDetector
  if (!Detector) return null
  try {
    const supported = await Detector.getSupportedFormats()
    if (!supported.includes('code_128')) return null
    return new Detector({ formats: NATIVE_FORMATS.filter((format) => supported.includes(format)) })
  } catch {
    return null
  }
}

async function enableContinuousFocus(stream: MediaStream): Promise<void> {
  const track = stream.getVideoTracks()[0]
  if (!track || typeof track.getCapabilities !== 'function') return
  const capabilities = track.getCapabilities() as MediaTrackCapabilities & { focusMode?: string[] }
  if (!capabilities.focusMode?.includes('continuous')) return
  await track
    .applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] })
    .catch(() => undefined)
}

function cropAimFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): boolean {
  const displayW = video.clientWidth
  const displayH = video.clientHeight
  const videoW = video.videoWidth
  const videoH = video.videoHeight
  if (!displayW || !displayH || !videoW || !videoH) return false

  const scale = Math.max(displayW / videoW, displayH / videoH)
  const visibleW = displayW / scale
  const visibleH = displayH / scale
  const offsetX = (videoW - visibleW) / 2
  const offsetY = (videoH - visibleH) / 2
  const frameW = Math.max(displayW - FRAME_INSET_X * 2, 1)
  const frameH = FRAME_HEIGHT
  const frameX = FRAME_INSET_X
  const frameY = (displayH - frameH) / 2

  const srcX = Math.max(0, offsetX + frameX / scale)
  const srcY = Math.max(0, offsetY + frameY / scale)
  const srcW = Math.min(videoW - srcX, frameW / scale)
  const srcH = Math.min(videoH - srcY, frameH / scale)
  if (srcW < 1 || srcH < 1) return false

  canvas.width = Math.round(srcW)
  canvas.height = Math.round(srcH)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return false
  context.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height)
  return true
}

function chooseCode(codes: DetectedCode[]): DetectedCode | null {
  const readable = codes.filter((code) => code.rawValue.trim())
  return (
    readable.find((code) => LINEAR_FORMATS.has(code.format)) ??
    readable[0] ??
    null
  )
}

export function canUseCamera(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof navigator.mediaDevices?.getUserMedia === 'function'
  )
}

export async function hasVideoInput(): Promise<boolean> {
  if (!canUseCamera() || typeof navigator.mediaDevices.enumerateDevices !== 'function') {
    return false
  }
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.some((device) => device.kind === 'videoinput')
  } catch {
    return false
  }
}

export function TrackingBarcodeScanner({ open, onClose, onScanned, onCameraProblem }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onScannedRef = useRef(onScanned)
  const onCameraProblemRef = useRef(onCameraProblem)
  onScannedRef.current = onScanned
  onCameraProblemRef.current = onCameraProblem

  useEffect(() => {
    if (!open) return
    const video = videoRef.current
    if (!video) return

    let cancelled = false
    let locked = false
    let stream: MediaStream | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let matrixTimer: ReturnType<typeof setTimeout> | undefined
    const canvas = document.createElement('canvas')

    const stopCamera = () => {
      clearTimeout(timer)
      clearTimeout(matrixTimer)
      stream?.getTracks().forEach((track) => track.stop())
      stream = null
      video.srcObject = null
    }

    const finish = (scan: LabelScan) => {
      if (!scan.trackingNumber || locked || cancelled) return
      locked = true
      stopCamera()
      onScannedRef.current(scan)
    }

    const accept = (raw: string, linear: boolean) => {
      const scan = parseLabelScan(raw)
      if (!scan.trackingNumber || locked || cancelled) return
      if (linear) {
        clearTimeout(matrixTimer)
        finish(scan)
        return
      }
      if (matrixTimer) return
      matrixTimer = setTimeout(() => finish(scan), MATRIX_WAIT_MS)
    }

    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS)
        if (cancelled) {
          stopCamera()
          return
        }
        await enableContinuousFocus(stream)
        if (cancelled) return
        video.srcObject = stream
        await video.play().catch(() => undefined)
        if (cancelled) return

        const detector = await createNativeDetector()
        if (cancelled) return

        if (detector) {
          const tick = async () => {
            if (cancelled || locked) return
            if (video.readyState >= 2 && cropAimFrame(video, canvas)) {
              try {
                const chosen = chooseCode(await detector.detect(canvas))
                if (chosen) accept(chosen.rawValue, LINEAR_FORMATS.has(chosen.format))
              } catch {
                // The next frame is tried again.
              }
            }
            if (!locked) timer = setTimeout(() => void tick(), SCAN_INTERVAL_MS)
          }
          void tick()
          return
        }

        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
          import('@zxing/browser'),
          import('@zxing/library'),
        ])
        if (cancelled) return
        const linearFormats = new Set<number>([
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.CODE_93,
          BarcodeFormat.CODABAR,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.ITF,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
        ])
        const hints = new Map<number, unknown>([
          [DecodeHintType.POSSIBLE_FORMATS, [...linearFormats, BarcodeFormat.QR_CODE, BarcodeFormat.PDF_417, BarcodeFormat.DATA_MATRIX, BarcodeFormat.AZTEC]],
          [DecodeHintType.TRY_HARDER, true],
        ])
        const reader = new BrowserMultiFormatReader(hints)
        const tick = () => {
          if (cancelled || locked) return
          if (video.readyState >= 2 && cropAimFrame(video, canvas)) {
            try {
              const result = reader.decodeFromCanvas(canvas)
              accept(result.getText(), linearFormats.has(result.getBarcodeFormat()))
            } catch {
              // No code in this frame.
            }
          }
          if (!locked) timer = setTimeout(tick, SCAN_INTERVAL_MS)
        }
        tick()
      } catch (error) {
        stopCamera()
        if (cancelled) return
        const name = error instanceof DOMException ? error.name : ''
        onCameraProblemRef.current(
          name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable',
        )
      }
    })()

    return () => {
      cancelled = true
      stopCamera()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scan label"
      className="fixed inset-0 z-50 flex flex-col bg-surface lg:items-center lg:justify-center lg:bg-ink-overlay lg:p-6"
    >
      <div className="flex min-h-0 w-full flex-1 flex-col bg-surface lg:max-h-[720px] lg:max-w-lg lg:flex-none lg:rounded-3xl lg:shadow-xl">
        <div className="px-5 pb-3 pt-[max(env(safe-area-inset-top),16px)] lg:pt-5">
          <h2 className="text-[22px] font-semibold text-ink">Scan label</h2>
          <p className="mt-1 text-[14px] leading-5 text-gray-500">
            Hold the label about 15 cm away, with the barcode inside the frame.
          </p>
        </div>
        <div className="relative mx-5 mb-4 min-h-[280px] flex-1 overflow-hidden rounded-3xl bg-ink-overlay lg:aspect-[3/4] lg:flex-none">
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            playsInline
            autoPlay
          />
          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-28 -translate-y-1/2 rounded-2xl border-2 border-ink" />
        </div>
        <div className="px-5 pb-[max(env(safe-area-inset-bottom),16px)] lg:pb-5">
          <Button label="Cancel" variant="outline" onClick={onClose} />
        </div>
      </div>
    </div>,
    document.body,
  )
}
