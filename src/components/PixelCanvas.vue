<script setup lang="ts">
import { computed } from 'vue'
import { overlayCellToCss } from '../core/onionSkin'
import { useEditorStore } from '../editor/useEditorStore'

const store = useEditorStore()

const displaySize = computed(() => {
  const size = store.canvasSize
  const cell = Math.floor(Math.min(512 / size, 24))
  return { size, cell, px: size * cell }
})

const onionActive = computed(() => store.onionGhosts.length > 0)

function onCellClick(x: number, y: number) {
  if (store.isPlaying) return
  store.onCanvasPointer(x, y)
}

function cellStyle(index: number) {
  const color = store.compositePixels[index]
  const size = displaySize.value.size
  const x = index % size
  const y = Math.floor(index / size)
  const checker = (x + y) % 2 === 0 ? '#2a2d35' : '#24272e'
  if (color !== null && color !== undefined) {
    return { backgroundColor: color }
  }
  // 真实图层为透明的格子才透出洋葱皮虚影
  const ghost = store.onionOverlay[index]
  if (ghost) {
    return { backgroundColor: overlayCellToCss(ghost) }
  }
  return { backgroundColor: checker }
}
</script>

<template>
  <main class="canvas-area">
    <div class="canvas-meta">
      <span>{{ store.canvasSize }}×{{ store.canvasSize }}</span>
      <span v-if="store.isPlaying" class="badge playing">动画预览中</span>
      <span v-else-if="store.previewFrameIndex !== null" class="badge">预览帧</span>
      <span v-if="onionActive" class="badge onion">洋葱皮</span>
    </div>
    <div
      class="pixel-grid"
      :style="{
        gridTemplateColumns: `repeat(${displaySize.size}, ${displaySize.cell}px)`,
        width: `${displaySize.px}px`,
        height: `${displaySize.px}px`,
      }"
    >
      <button
        v-for="(_, index) in store.compositePixels"
        :key="index"
        type="button"
        class="pixel-cell"
        :style="cellStyle(index)"
        :aria-label="`像素 ${index}`"
        @click="onCellClick(index % displaySize.size, Math.floor(index / displaySize.size))"
      />
    </div>
  </main>
</template>
