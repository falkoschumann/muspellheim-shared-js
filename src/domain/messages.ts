// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

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
export type CommandStatus = Success | Failure;

/**
 * A successful status.
 */
export class Success {
  readonly isSuccess = true;
}

/**
 * A failed status.
 */
export class Failure {
  readonly isSuccess = false;
  errorMessage: string;

  /**
   * Creates a failed status.
   *
   * @param errorMessage
   */
  constructor(errorMessage: string) {
    this.errorMessage = errorMessage;
  }
}
