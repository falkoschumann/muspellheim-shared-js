/**
 * @import * as express from 'express'
 */

export function runSafe(/** @type {express.RequestHandler} */ handler) {
  // TODO runSafe is obsolete with with Express 5
  return async (request, response, next) => {
    try {
      await handler(request, response);
    } catch (error) {
      next(error);
    }
  };
}

export function reply(
  /** @type {express.Response} */ response,
  { status = 200, headers = { 'Content-Type': 'text/plain' }, body = '' } = {},
) {
  response.status(status).header(headers).send(body);
}
