// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * A central place to register and resolve services.
 */
export class ServiceLocator {
  static #instance = new ServiceLocator();

  /**
   * Gets the default service locator.
   *
   * @return {ServiceLocator} The default service locator.
   */
  static getDefault() {
    return ServiceLocator.#instance;
  }

  #services = new Map();

  /**
   * Registers a service with name.
   *
   * @param {string} name The name of the service.
   * @param {object|Function} service The service object or constructor.
   */
  register(name, service) {
    this.#services.set(name, service);
  }

  /**
   * Resolves a service by name.
   *
   * @param {string} name The name of the service.
   * @return {object} The service object.
   */
  resolve(name) {
    const service = this.#services.get(name);
    if (service == null) {
      throw new Error(`Service not found: ${name}.`);
    }

    return typeof service === 'function' ? service() : service;
  }
}
