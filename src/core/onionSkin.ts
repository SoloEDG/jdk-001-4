import { MAX_ONION_SKIN_FRAMES } from './constants'
import { compositeLayers } from './pixelGrid'
import type { Frame, OnionSkinSettings, Pixel } from './types'

export interface OnionGhost {
  frameIndex: number
  direction: 'prev' | 'next'
  /** 与当前帧的距离，1 为相邻帧 */
  distance: number
  /** 含距离衰减后的有效不透明度 */
  opacity: number
  /** 该帧可见图层的合成结果（隐藏图层不进入虚影） */
  pixels: Pixel[]
}

export interface OnionOverlayCell {
  r: number
  g: number
  b: number
  a: number
}

export function clampOnionCount(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(MAX_ONION_SKIN_FRAMES, Math.round(value)))
}

export function clampOnionOpacity(value: number): number {
  if (!Number.isFinite(value)) return 0.35
  return Math.max(0.05, Math.min(1, value))
}

/** 距离越远越淡：相邻帧为完整设定透明度，最远一帧按比例衰减 */
function falloffOpacity(base: number, distance: number, count: number): number {
  return base * ((count - distance + 1) / count)
}

/**
 * 收集当前帧前后相邻帧的洋葱皮虚影。
 * 只读真实帧数据做显示合成，不修改任何帧/图层内容。
 */
export function collectOnionGhosts(
  frames: Frame[],
  activeIndex: number,
  settings: OnionSkinSettings,
  size: number,
): OnionGhost[] {
  if (!settings.enabled) return []
  const opacity = clampOnionOpacity(settings.opacity)
  const ghosts: OnionGhost[] = []

  const prevCount = clampOnionCount(settings.prevCount)
  for (let d = 1; d <= prevCount; d++) {
    const idx = activeIndex - d
    const frame = frames[idx]
    if (idx < 0 || !frame) break
    ghosts.push({
      frameIndex: idx,
      direction: 'prev',
      distance: d,
      opacity: falloffOpacity(opacity, d, prevCount),
      pixels: compositeLayers(frame.layers, size),
    })
  }

  const nextCount = clampOnionCount(settings.nextCount)
  for (let d = 1; d <= nextCount; d++) {
    const idx = activeIndex + d
    const frame = frames[idx]
    if (idx >= frames.length || !frame) break
    ghosts.push({
      frameIndex: idx,
      direction: 'next',
      distance: d,
      opacity: falloffOpacity(opacity, d, nextCount),
      pixels: compositeLayers(frame.layers, size),
    })
  }

  return ghosts
}

function hexToRgb(color: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (!m || !m[1]) return null
  let hex = m[1]
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((ch) => ch + ch)
      .join('')
  }
  const num = parseInt(hex, 16)
  return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff]
}

function sourceOver(
  dst: OnionOverlayCell,
  src: [number, number, number],
  srcA: number,
): OnionOverlayCell {
  const a = srcA + dst.a * (1 - srcA)
  if (a <= 0) return { r: 0, g: 0, b: 0, a: 0 }
  return {
    r: Math.round((src[0] * srcA + dst.r * dst.a * (1 - srcA)) / a),
    g: Math.round((src[1] * srcA + dst.g * dst.a * (1 - srcA)) / a),
    b: Math.round((src[2] * srcA + dst.b * dst.a * (1 - srcA)) / a),
    a,
  }
}

/**
 * 把所有虚影帧合并成一张覆盖层（仅供编辑区显示用）。
 * 远的帧垫底、近的帧在上，按各自透明度做 source-over 混合。
 */
export function mergeOnionOverlay(
  ghosts: OnionGhost[],
  size: number,
): (OnionOverlayCell | null)[] {
  const total = size * size
  const overlay: (OnionOverlayCell | null)[] = Array.from({ length: total }, () => null)
  if (ghosts.length === 0) return overlay

  const ordered = [...ghosts].sort((a, b) => {
    if (a.distance !== b.distance) return b.distance - a.distance
    return a.direction === b.direction ? 0 : a.direction === 'prev' ? -1 : 1
  })

  for (const ghost of ordered) {
    for (let i = 0; i < total; i++) {
      const color = ghost.pixels[i]
      if (color === null || color === undefined) continue
      const rgb = hexToRgb(color)
      if (!rgb) continue
      const base = overlay[i] ?? { r: 0, g: 0, b: 0, a: 0 }
      overlay[i] = sourceOver(base, rgb, ghost.opacity)
    }
  }

  return overlay
}

export function overlayCellToCss(cell: OnionOverlayCell): string {
  return `rgba(${cell.r}, ${cell.g}, ${cell.b}, ${Number(cell.a.toFixed(3))})`
}
