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
 * A message has a type to identify and data as payload.
 */
export type Message<TData = unknown> = Readonly<{
  type: string;
  data: TData;
}>;

/**
 * The status returned by a command handler.
 */
export type CommandStatus<S = unknown, F = string> = Success<S> | Failure<F>;

/**
 * Create a success or failure object from a object compatible with command
 * status.
 */
export function createCommandStatus<S = void, F = string>(status: {
  isSuccess?: boolean;
  result?: S extends void ? undefined : S;
  errorMessage?: F;
}): Success<S> | Failure<F> {
  if (typeof status !== "object" || status == null) {
    throw new TypeError("The status is invalid");
  }

  if ("isSuccess" in status && status.isSuccess) {
    const result = "result" in status ? status.result : undefined;
    return new Success<S>(result as S extends void ? undefined : S);
  }

  if ("errorMessage" in status) {
    return new Failure<F>(status.errorMessage as F);
  }

  throw new TypeError("The status is invalid");
}

/**
 * A successful status.
 */
export class Success<T = void> {
  readonly isSuccess = true;
  readonly result: T extends void ? undefined : T;

  constructor(result?: T extends void ? undefined : T) {
    this.result = result as T extends void ? undefined : T;
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
