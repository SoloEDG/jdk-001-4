<script setup lang="ts">
import { computed } from 'vue'
import { MAX_FRAMES, MAX_ONION_SKIN_FRAMES } from '../core/constants'
import { useEditorStore } from '../editor/useEditorStore'

const store = useEditorStore()

const frames = computed(() => store.activeProject?.frames ?? [])
const canAdd = computed(() => frames.value.length < MAX_FRAMES)

const displayIndex = computed(
  () => store.previewFrameIndex ?? store.activeProject?.activeFrameIndex ?? 0,
)

const onion = computed(() => store.prefs.onionSkin)
const onionOpacityPercent = computed(() => Math.round(onion.value.opacity * 100))

function onPrevCountInput(event: Event) {
  store.setOnionPrevCount(Number((event.target as HTMLInputElement).value))
}

function onNextCountInput(event: Event) {
  store.setOnionNextCount(Number((event.target as HTMLInputElement).value))
}

function onOpacityInput(event: Event) {
  store.setOnionOpacity(Number((event.target as HTMLInputElement).value) / 100)
}
</script>

<template>
  <section class="panel side-panel">
    <h3>动画帧 <small>(最多 {{ MAX_FRAMES }} 帧)</small></h3>
    <ul class="frame-list">
      <li
        v-for="(frame, index) in frames"
        :key="frame.id"
        class="frame-item"
        :class="{
          active: displayIndex === index && !store.isPlaying,
          preview: store.previewFrameIndex === index,
        }"
      >
        <button
          type="button"
          class="name"
          :disabled="store.isPlaying"
          @click="store.setActiveFrame(index)"
        >
          {{ frame.name }}
        </button>
        <button
          type="button"
          class="icon danger"
          :disabled="frames.length <= 1 || store.isPlaying"
          @click="store.deleteFrame(index)"
        >
          ✕
        </button>
      </li>
    </ul>
    <button type="button" class="action" :disabled="!canAdd || store.isPlaying" @click="store.addFrame">
      新建帧
    </button>

    <label class="delay-field">
      帧间隔 (ms)
      <input
        type="number"
        min="50"
        max="5000"
        step="50"
        :value="store.activeProject?.frameDelayMs"
        :disabled="store.isPlaying"
        @change="store.setFrameDelay(Number(($event.target as HTMLInputElement).value))"
      />
    </label>

    <button type="button" class="action primary" @click="store.togglePlayback">
      {{ store.isPlaying ? '停止播放' : '播放动画' }}
    </button>

    <div class="onion-panel">
      <label class="onion-toggle">
        <input
          type="checkbox"
          :checked="onion.enabled"
          @change="store.setOnionEnabled(($event.target as HTMLInputElement).checked)"
        />
        洋葱皮预览
      </label>
      <template v-if="onion.enabled">
        <p class="hint">虚影仅用于对照，不会导出或影响取色</p>
        <label class="onion-field">
          前几帧
          <input
            type="number"
            min="0"
            :max="MAX_ONION_SKIN_FRAMES"
            step="1"
            :value="onion.prevCount"
            @change="onPrevCountInput"
          />
        </label>
        <label class="onion-field">
          后几帧
          <input
            type="number"
            min="0"
            :max="MAX_ONION_SKIN_FRAMES"
            step="1"
            :value="onion.nextCount"
            @change="onNextCountInput"
          />
        </label>
        <label class="onion-field">
          透明度 {{ onionOpacityPercent }}%
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            :value="onionOpacityPercent"
            @input="onOpacityInput"
          />
        </label>
      </template>
    </div>
  </section>
</template>
