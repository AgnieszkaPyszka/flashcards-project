/**
 * Logger utility for consistent error logging across the application
 */
export class Logger {
  constructor(private readonly context: string) {}

  /**
   * Logs an error with context and optional metadata
   * Ensures sensitive data is never logged
   */
  error(error: Error, metadata?: Record<string, unknown>) {
    const sanitizedMetadata = this.sanitizeMetadata(metadata);

    console.error({
      context: this.context,
      error: {
        name: error.name,
        message: error.message,
        ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
      },
      ...(sanitizedMetadata ? { metadata: sanitizedMetadata } : {}),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Logs a warning message with context and optional metadata
   */
  warn(message: string, metadata?: Record<string, unknown>) {
    const sanitizedMetadata = this.sanitizeMetadata(metadata);

    console.warn({
      context: this.context,
      message,
      ...(sanitizedMetadata ? { metadata: sanitizedMetadata } : {}),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Removes sensitive data from metadata before logging
   */
  private sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!metadata) return undefined;

    const sensitiveKeys = ["apiKey", "token", "password", "secret", "authorization"];
    const sanitized = { ...metadata };

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((sensitiveKey) => key.toLowerCase().includes(sensitiveKey.toLowerCase()))) {
        sanitized[key] = "[REDACTED]";
      }
    }

    return sanitized;
  }
}
