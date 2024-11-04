// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * Assert that an object is not `null`.
 *
 * @param {*} object - the object to check
 * @param {string|Function} message - the message to throw or a function that returns the message
 */
export function assertNotNull(object, message) {
  if (object == null) {
    message = typeof message === 'function' ? message() : message;
    throw new ReferenceError(message);
  }
}
