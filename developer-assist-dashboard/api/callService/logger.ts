/**
 * Logger class for logging messages.
 */
export class Logger {
  /**
   * Log an error message.
   * @param {string} message - The error message.
   */
  static error(message: string): void {
    console.error(message);
  }

  /**
   * Log a debug message.
   * @param {string} message - The debug message.
   */
  static debug(message: string): void {
    console.log(message);
  }
}
