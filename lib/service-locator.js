/**
 * A central place to register and resolve services.
 */
export class ServiceLocator {
  static #instance = new ServiceLocator();

  /**
   * Gets the default service locator.
   *
   * @returns {ServiceLocator} the default service locator
   */
  static getDefault() {
    return ServiceLocator.#instance;
  }

  #services = new Map();

  /**
   * Registers a service with name.
   *
   * @param {string} name - the name of the service
   * @param {object|Function} service - the service object or constructor
   */
  register(name, service) {
    this.#services.set(name, service);
  }

  /**
   * Resolves a service by name.
   *
   * @param {string} name - the name of the service
   * @returns {object} the service object
   */
  resolve(name) {
    const service = this.#services.get(name);
    if (service == null) {
      throw new Error(`Service not found: ${name}.`);
    }

    return typeof service === 'function' ? service() : service;
  }
}
