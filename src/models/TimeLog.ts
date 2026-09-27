export type LogType = 'passive' | 'pomodoro' | 'offline' | 'manual';

export interface TimeLog {
    id: string;          // Unique identifier for the log entry
    docId: string;       // SiYuan document block ID
    startTime: number;   // Timestamp when the document was focused
    endTime: number;     // Timestamp when the focus was lost or saved
    duration: number;    // Effective duration in seconds (excluding idle time)
    idleTime: number;    // Idle time in seconds deducted from this session
    
    // P0 扩展字段
    type?: LogType;            // 会话类型: 'passive' (被动), 'pomodoro' (番茄钟), 'offline' (离桌归因), 'manual' (手动补录)
    isPomodoro?: boolean;      // 快捷标识是否为番茄冲刺会话
    pomodoroTargetMin?: number;// 番茄钟预设目标时长（分钟）
    note?: string;             // 归因说明或线下活动备注
    tags?: string[];           // 自定义分类标签
}

export interface DocumentMeta {
    docId: string;
    title: string;
    notebook: string;
    path: string;
    tags: string[];
    color?: string;
}

