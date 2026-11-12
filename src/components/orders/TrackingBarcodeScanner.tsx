'use client'

import { Button } from '@/components/ui/Button'
import type { IScannerControls } from '@zxing/browser'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export type CameraProblem = 'denied' | 'unavailable'

type Props = {
  open: boolean
  onClose: () => void
  onScanned: (value: string) => void
  onCameraProblem: (problem: CameraProblem) => void
}

const SCAN_INTERVAL_MS = 150

const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
}

const NATIVE_FORMATS = [
  'code_128',
  'code_39',
  'code_93',
  'codabar',
  'ean_13',
  'ean_8',
  'itf',
  'upc_a',
  'upc_e',
  'qr_code',
  'pdf417',
  'data_matrix',
  'aztec',
]

type NativeBarcodeDetector = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>
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
    let controls: IScannerControls | null = null
    let timer: ReturnType<typeof setTimeout> | undefined

    const stopCamera = () => {
      clearTimeout(timer)
      controls?.stop()
      controls = null
      stream?.getTracks().forEach((track) => track.stop())
      stream = null
      video.srcObject = null
    }

    const finish = (raw: string) => {
      const value = raw.trim()
      if (!value || locked || cancelled) return
      locked = true
      stopCamera()
      onScannedRef.current(value)
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

        const detector = await createNativeDetector()
        if (cancelled) return

        if (detector) {
          video.srcObject = stream
          await video.play().catch(() => undefined)
          const tick = async () => {
            if (cancelled || locked) return
            if (video.readyState >= 2) {
              try {
                const codes = await detector.detect(video)
                const first = codes.find((code) => code.rawValue.trim())
                if (first) {
                  finish(first.rawValue)
                  return
                }
              } catch {
                // The next frame is tried again.
              }
            }
            timer = setTimeout(() => void tick(), SCAN_INTERVAL_MS)
          }
          void tick()
          return
        }

        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
          import('@zxing/browser'),
          import('@zxing/library'),
        ])
        if (cancelled) return
        const hints = new Map<number, unknown>([
          [
            DecodeHintType.POSSIBLE_FORMATS,
            [
              BarcodeFormat.CODE_128,
              BarcodeFormat.CODE_39,
              BarcodeFormat.CODE_93,
              BarcodeFormat.CODABAR,
              BarcodeFormat.EAN_13,
              BarcodeFormat.EAN_8,
              BarcodeFormat.ITF,
              BarcodeFormat.UPC_A,
              BarcodeFormat.UPC_E,
              BarcodeFormat.QR_CODE,
              BarcodeFormat.PDF_417,
              BarcodeFormat.DATA_MATRIX,
              BarcodeFormat.AZTEC,
            ],
          ],
          [DecodeHintType.TRY_HARDER, true],
        ])
        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: SCAN_INTERVAL_MS,
          delayBetweenScanSuccess: SCAN_INTERVAL_MS,
        })
        const started = await reader.decodeFromStream(stream, video, (result) => {
          if (result) finish(result.getText())
        })
        if (cancelled || locked) {
          started.stop()
          return
        }
        controls = started
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
          <p className="mt-1 text-[14px] leading-5 text-gray-500">Hold the label about 15 cm away, with the barcode inside the frame.</p>
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
