// ============================================================
// Binary Boxer — Structured Logger
// Lightweight JSON logger for server-side route handlers
// ============================================================

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  route: string;
  postId?: string;
  message: string;
  error?: string;
  timestamp: string;
}

const emit = (entry: LogEntry): void => {
  const line = JSON.stringify(entry);
  if (entry.level === 'error') {
    console.error(line);
  } else if (entry.level === 'warn') {
    console.warn(line);
  } else {
    console.info(line);
  }
};

export const log = {
  info(route: string, message: string, postId?: string): void {
    emit({ level: 'info', route, postId, message, timestamp: new Date().toISOString() });
  },

  warn(route: string, message: string, postId?: string): void {
    emit({ level: 'warn', route, postId, message, timestamp: new Date().toISOString() });
  },

  error(route: string, message: string, error?: unknown, postId?: string): void {
    emit({
      level: 'error',
      route,
      postId,
      message,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  },
};
