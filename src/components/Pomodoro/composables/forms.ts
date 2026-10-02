/** 番茄钟表盘形态的枚举键。设置项里持久化的值，改展示名不改枚举 */
export type PomodoroFormKey = 'zen' | 'chrono' | 'hourglass';

/** 形态键与展示标签 i18n 键的映射，集中一处便于新增第四形态 */
export const POMODORO_FORM_LABEL_KEYS: Record<PomodoroFormKey, string> = {
  zen: 'pomodoroFormAuroraName',
  chrono: 'pomodoroFormChronoName',
  hourglass: 'pomodoroFormSandfallName',
};
