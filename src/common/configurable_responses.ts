// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.
// Copyright 2023 Titanium I.T. LLC. MIT License.

/**
 * Handle returning pre-configured responses.
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
export class ConfigurableResponses<T> {
  /**
   * Create a list of responses (by providing an array), or a single repeating
   * response (by providing any other type). 'Name' is optional and used in
   * error messages.
   *
   * @param responses A single response or an array of responses.
   * @param name An optional name for the responses.
   */
  static create<T>(responses?: T | T[], name?: string) {
    return new ConfigurableResponses<T>(responses, name);
  }

  /**
   * Convert all properties in an object into ConfigurableResponse instances.
   * For example, { a: 1 } becomes { a: ConfigurableResponses.create(1) }.
   * 'Name' is optional and used in error messages.
   *
   * @param responseObject An object with single response or an array of responses.
   * @param name An optional name for the responses.
   */
  static mapObject<T extends Record<string, unknown>>(
    responseObject: T,
    name?: string,
  ) {
    const entries = Object.entries(responseObject);
    const translatedEntries = entries.map(([key, value]) => {
      const translatedName = name === undefined ? undefined : `${name}: ${key}`;
      return [key, ConfigurableResponses.create(value, translatedName)];
    });
    return Object.fromEntries(translatedEntries);
  }

  readonly #description;
  readonly #responses;

  /**
   * Create a list of responses (by providing an array), or a single repeating
   * response (by providing any other type). 'Name' is optional and used in
   * error messages.
   *
   * @param responses A single response or an array of responses.
   * @param name An optional name for the responses.
   */
  constructor(responses?: T | T[], name?: string) {
    this.#description = name == null ? "" : ` in ${name}`;
    this.#responses = Array.isArray(responses) ? [...responses] : responses;
  }

  /**
   * Get the next configured response. Throws an error when configured with a list
   * of responses and no more responses remain.
   *
   * @return The next response.
   */
  next(): T {
    const response = Array.isArray(this.#responses)
      ? this.#responses.shift()
      : this.#responses;
    if (response === undefined) {
      throw new Error(`No more responses configured${this.#description}.`);
    }

    return response;
  }
}
