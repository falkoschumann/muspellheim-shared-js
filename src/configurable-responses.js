/**
 * Handles returning a pre-configured responses.
 *
 * This is one of the nullability patterns from James Shore for
 * [testing without mocks](https://www.jamesshore.com/v2/projects/nullables/testing-without-mocks#configurable-responses).
 *
 * Example usage:
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
   */
  static create(
    /** @type {Object|Array} */ responses,
    /** @type {string} */ name,
  ) {
    return new ConfigurableResponses(responses, name);
  }

  #description;
  #responses;

  constructor(
    /** @type {Object|Array} */ responses,
    /** @type {string} */ name,
  ) {
    this.#description = name == null ? '' : ` in ${name}`;
    this.#responses = Array.isArray(responses) ? [...responses] : responses;
  }

  /**
   * Returns the next response.
   *
   * If there are no more responses, an error is thrown. If a single response is
   * configured, it is always returned.
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
