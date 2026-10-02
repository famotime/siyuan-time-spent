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

/**
 * 播放整轮番茄达成、进入长休息的更强仪式感和弦 (C5 - E5 - G5 - C6)
 * 四音阶梯式上行，音色比单颗番茄更厚重，标记一个完整周期的落幕
 */
export function playCycleCompleteChord() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  playTone(ctx, 523.25, now, 0.5, 0.12);          // C5
  playTone(ctx, 659.25, now + 0.13, 0.55, 0.13);  // E5
  playTone(ctx, 783.99, now + 0.26, 0.6, 0.14);   // G5
  playTone(ctx, 1046.5, now + 0.4, 0.85, 0.16);   // C6
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
