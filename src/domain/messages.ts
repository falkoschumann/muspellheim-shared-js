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
export type CommandStatus<S = unknown, F = string> = Success<S> | Failure<F>;

/**
 * Create a success or failure object from a object compatible with command
 * status.
 */
export function createCommandStatus<S = unknown, F = string>(
  status: CommandStatus<S, F>,
): Success<S> | Failure<F> {
  if (status.isSuccess) {
    return new Success<S>(status.result);
  } else {
    return new Failure<F>(status.errorMessage);
  }
}

/**
 * A successful status.
 */
export class Success<T = unknown> {
  readonly isSuccess = true;
  readonly result?: T;

  constructor(result?: T) {
    this.result = result;
  }
}

/**
 * A failed status.
 */
export class Failure<T = string> {
  readonly isSuccess = false;
  readonly errorMessage: T;

  /**
   * Creates a failed status.
   *
   * @param errorMessage
   */
  constructor(errorMessage: T) {
    this.errorMessage = errorMessage;
  }
}
