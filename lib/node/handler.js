// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * @import express from 'express'
 */

// TODO Remove dependency to express

export function runSafe(/** @type {express.RequestHandler} */ handler) {
  // TODO runSafe is obsolete with with Express 5
  return async (request, response, next) => {
    try {
      await handler(request, response, next);
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
