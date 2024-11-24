/**
 * Provides CQNS features.
 *
 * The Command Query Notification Separation principle is a software design
 * principle that separates the concerns of commands, queries, and
 * notifications.
 *
 * Message hierarchy:
 *
 * - Message
 *   - Incoming / outgoing
 *     - Request (outgoing) -> response (incoming)
 *       - Command -> command status
 *       - Query -> query result
 *     - Notification
 *       - Incoming: notification -> commands
 *       - Outgoing
 *   - Event (internal)
 *
 * @see https://ralfw.de/command-query-notification-separation-cqns/
 * @module
 */

/**
 * The status returned by a command handler.
 */
export class CommandStatus {
  /**
   * Creates a successful status.
   */
  static success() {
    return new CommandStatus(true);
  }

  /**
   * Creates a failed status.
   *
   * @param {string} errorMessage
   */
  static failure(errorMessage) {
    return new CommandStatus(false, errorMessage);
  }

  /**
   * Indicates whether the command was successful.
   *
   * @type {boolean}
   */
  isSuccess;

  /**
   * The error message if the command failed.
   *
   * @type {string}
   */
  errorMessage;

  /**
   * Creates a new instance of CommandStatus.
   *
   * @param {boolean} isSuccess Indicates whether the command was successful.
   * @param {string} [errorMessage] The error message if the command failed.
   */
  constructor(isSuccess, errorMessage) {
    this.isSuccess = isSuccess;
    this.errorMessage = errorMessage;
  }
}
