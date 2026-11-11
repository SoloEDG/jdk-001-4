export type CanvasSize = 16 | 32 | 64

export type Pixel = string | null

export type ToolType = 'brush' | 'eraser' | 'bucket' | 'eyedropper' | 'line'

export interface Layer {
  id: string
  name: string
  visible: boolean
  pixels: Pixel[]
}

export interface Frame {
  id: string
  name: string
  layers: Layer[]
}

export interface PixelProject {
  id: string
  name: string
  canvasSize: CanvasSize
  frames: Frame[]
  activeFrameIndex: number
  activeLayerIndex: number
  frameDelayMs: number
  recentColors: string[]
  customColors: string[]
  updatedAt: number
}

export interface OnionSkinSettings {
  enabled: boolean
  /** 当前帧之前显示的虚影帧数 */
  prevCount: number
  /** 当前帧之后显示的虚影帧数 */
  nextCount: number
  /** 0.05 - 1，最近邻帧的不透明度，越远越淡 */
  opacity: number
}

export interface EditorPreferences {
  activeColor: string
  activeTool: ToolType
  activeProjectId: string | null
  onionSkin: OnionSkinSettings
}
