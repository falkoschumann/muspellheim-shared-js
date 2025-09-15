// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

import { ConfigurableResponses } from "../common/configurable_responses";

/**
 * This data object configures the response of a fetch stub call.
 */
export interface ResponseData {
  /** The HTTP status code. */
  status: number;

  /** The HTTP status text. */
  statusText: string;

  /** The optional response body. */
  body?: Blob | object | string | null;
}

/**
 * Create a fetch stub.
 *
 * The stub returns a response from the provided response data or throws an provided error.
 *
 * @param responses A single response or an array of responses.
 * @returns The fetch stub.
 */
export function createFetchStub(
  responses?: ResponseData | Error | (ResponseData | Error)[],
): () => Promise<Response> {
  const configurableResponses = ConfigurableResponses.create(responses);
  return async function () {
    const response = configurableResponses.next();
    if (response instanceof Error) {
      throw response;
    }

    return new ResponseStub(response) as unknown as Response;
  };
}

class ResponseStub {
  #status: number;
  #statusText: string;
  #body?: Blob | object | string | null;

  constructor({ status, statusText, body = null }: ResponseData) {
    this.#status = status;
    this.#statusText = statusText;
    this.#body = body;
  }

  get ok() {
    return this.status >= 200 && this.status < 300;
  }

  get status() {
    return this.#status;
  }

  get statusText() {
    return this.#statusText;
  }

  async blob() {
    if (this.#body == null) {
      return null;
    }

    if (this.#body instanceof Blob) {
      return this.#body;
    }

    throw new TypeError("Body is not a Blob.");
  }

  async json() {
    const json =
      typeof this.#body === "string" ? this.#body : JSON.stringify(this.#body);
    return Promise.resolve(JSON.parse(json));
  }

  async text() {
    if (this.#body == null) {
      return "";
    }

    return String(this.#body);
  }
}
