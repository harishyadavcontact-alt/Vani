type LogLevel = 'info' | 'warn' | 'error'

export function log(level: LogLevel, event: string, data: Record<string, unknown> = {}) {
  console[level](`[vani] ${event}`, data)
}
