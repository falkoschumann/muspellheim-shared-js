// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * Handle returning a pre-configured responses.
 *
 * This is one of the nullability patterns from James Shore's article on
 * [testing without mocks](https://www.jamesshore.com/v2/projects/nullables/testing-without-mocks#configurable-responses).
 *
 * Example usage for stubbing `fetch` function:
 *
 * ```javascript
 * function createFetchStub(responses) {
 *   const configurableResponses = ConfigurableResponses.create(responses);
 *   return async function () {
 *     const response = configurableResponses.next();
 *     return {
 *       status: response.status,
 *       json: async () => response.body,
 *     };
 *   };
 * }
 * ```
 */
export class ConfigurableResponses {
  /**
   * Creates a configurable responses instance from a single response or an
   * array of responses with an optional response name.
   *
   * @param {*|Array} responses A single response or an array of responses.
   * @param {string} [name] An optional name for the responses.
   */
  static create(responses, name) {
    return new ConfigurableResponses(responses, name);
  }

  #description;
  #responses;

  /**
   * Creates a configurable responses instance from a single response or an
   * array of responses with an optional response name.
   *
   * @param {*|Array} responses A single response or an array of responses.
   * @param {string} [name] An optional name for the responses.
   */
  constructor(/** @type {*|Array} */ responses, /** @type {?string} */ name) {
    this.#description = name == null ? '' : ` in ${name}`;
    this.#responses = Array.isArray(responses) ? [...responses] : responses;
  }

  /**
   * Returns the next response.
   *
   * If there are no more responses, an error is thrown. If a single response is
   * configured, it is always returned.
   *
   * @returns {*} The next response.
   */
  next() {
    const response = Array.isArray(this.#responses)
      ? this.#responses.shift()
      : this.#responses;
    if (response === undefined) {
      throw new Error(`No more responses configured${this.#description}.`);
    }

    return response;
  }
}
