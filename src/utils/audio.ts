/**
 * 纯 Web Audio API 提示音合成器
 * 零资源文件依赖，生成优雅轻柔的番茄钟完成和弦
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

/**
 * 播放清脆悦耳的双音节番茄钟达成和弦 (C6 - G6)
 */
export function playPomodoroCompleteChord() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 第一音符: C6 (1046.5 Hz)
  playTone(ctx, 1046.5, now, 0.45, 0.15);

  // 第二音符: G6 (1567.98 Hz)
  playTone(ctx, 1567.98, now + 0.16, 0.65, 0.18);
}

/**
 * 播放柔和的休息结束提示音 (E5 - A5)
 */
export function playBreakCompleteChord() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  playTone(ctx, 659.25, now, 0.35, 0.12);
  playTone(ctx, 880.0, now + 0.14, 0.5, 0.15);
}

function playTone(ctx: AudioContext, freq: number, startTime: number, duration: number, maxGain: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(maxGain, startTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}
