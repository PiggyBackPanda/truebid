/**
 * Minimal structured logger.
 * In production, replace with a proper logging service (e.g. Pino, Datadog, Sentry).
 * Outputs JSON in production, pretty-prints in development.
 */

type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, message: string, context?: unknown): void {
  const entry = {
    level,
    time: new Date().toISOString(),
    msg: message,
    ...(context !== undefined ? { context } : {}),
  };

  if (process.env.NODE_ENV === "production") {
    // JSON output for log aggregation tools
    if (level === "error") {
      console.error(JSON.stringify(entry));
    } else if (level === "warn") {
      console.warn(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  } else {
    // Human-readable in development
    const prefix = `[${level.toUpperCase()}] ${message}`;
    if (level === "error") {
      console.error(prefix, context ?? "");
    } else if (level === "warn") {
      console.warn(prefix, context ?? "");
    } else {
      console.log(prefix, context ?? "");
    }
  }
}

export const logger = {
  info: (message: string, context?: unknown) => log("info", message, context),
  warn: (message: string, context?: unknown) => log("warn", message, context),
  error: (message: string, context?: unknown) => log("error", message, context),
};
