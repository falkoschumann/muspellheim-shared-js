export class ServiceLocator {
  #services = new Map();

  register(name, service) {
    this.#services.set(name, service);
  }

  resolve(name) {
    const service = this.#services.get(name);
    if (service == null) {
      throw new Error(`Service not found: ${name}`);
    }

    return typeof service === 'function' ? service() : service;
  }
}
