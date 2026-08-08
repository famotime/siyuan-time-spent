export interface TimeLog {
    id: string;          // Unique identifier for the log entry
    docId: string;       // SiYuan document block ID
    startTime: number;   // Timestamp when the document was focused
    endTime: number;     // Timestamp when the focus was lost or saved
    duration: number;    // Effective duration in seconds (excluding idle time)
    idleTime: number;    // Idle time in seconds deducted from this session
}

export interface DocumentMeta {
    docId: string;
    title: string;
    notebook: string;
    path: string;
    tags: string[];
    color?: string;
}
