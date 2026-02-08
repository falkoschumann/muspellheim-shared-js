// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

import { ConfigurableResponses } from "./configurable_responses";

/**
 * This data object configures the response of a fetch stub call.
 */
export interface ResponseData {
  /** The HTTP status code. */
  status: number;

  /** The HTTP status text. */
  statusText: string;

  /** The optional response body. */
  body?: BodyInit | object;
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

    let body = response?.body;
    if (
      body != null &&
      !(body instanceof Blob) &&
      !(typeof body === "string")
    ) {
      // If the body is an object, we convert it to a JSON string.
      body = JSON.stringify(body);
    }
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
    });
  };
}
