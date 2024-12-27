// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * This module provides a validation framework for validating objects against
 * constraints.
 *
 * @module
 */

import { Ajv } from 'ajv';

/**
 * Returns a new default validator factory. The default validator factory uses
 * JSON schema to validate objects. The JSON schema must be defined as a static
 * property `SCHEMA` on the object to validate.
 *
 * @returns {ValidatorFactory} A new default validator factory.
 * @see ServerConfiguration for an example.
 */
export function buildDefaultValidatorFactory() {
  return {
    getValidator: () => {
      const ajv = new Ajv({ allErrors: true });
      return {
        validate: (object) => {
          const schema = object.constructor.SCHEMA;
          if (schema == null) {
            return [];
          }

          const valid = ajv.validate(schema, object);
          if (valid) {
            return [];
          }

          return ajv.errors.map((error) => {
            return new ConstraintViolation(error.message, error.instancePath);
          });
        },
      };
    },
  };
}

/**
 * Factory for creating a validator.
 *
 * @interface
 */
export class ValidatorFactory {
  /**
   * Returns a new validator.
   *
   * @returns {Validator} a new validator.
   * @abstract
   */
  getValidator() {
    throw new Error('Not implemented.');
  }
}

/**
 * Validates an object against constraints.
 *
 * @interface
 */
export class Validator {
  /**
   * Validates the given object.
   *
   * @param {object} object
   * @returns {ConstraintViolation[]} the constraint violations or an empty array if the object is valid.
   * @abstract
   */
  validate(_object) {
    throw new Error('Not implemented.');
  }
}

/**
 * Describes a constraint violation.
 */
export class ConstraintViolation {
  /**
   * Creates a new constraint violation.
   *
   * @param {string} message the message describing the violation.
   * @param {string} propertyPath the path to the property that violates the constraint.
   */
  constructor(message, propertyPath) {
    this.message = message;
    this.propertyPath = propertyPath;
  }
}

/**
 * Base class for validation errors.
 */
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Error for constraint violations.
 */
export class ConstraintViolationError extends ValidationError {
  static #toString(constraintViolations) {
    return constraintViolations
      .map((cv) => `${cv.propertyPath}: ${cv.message}`)
      .join(', ');
  }

  /**
   * Creates a new constraint violation error.
   *
   * @param {ConstraintViolation[]} constraintViolations the constraint violations.
   * @param {string} [message] the error message.
   */
  constructor(constraintViolations, message) {
    super(
      message != null
        ? message
        : ConstraintViolationError.#toString(constraintViolations),
    );
    this.name = 'ConstraintViolationError';
    this.constraintViolations = constraintViolations;
  }
}
