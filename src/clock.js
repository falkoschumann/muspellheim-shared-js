export class Clock {
  static create() {
    return new Clock();
  }

  static createNull({ fixed = new Date('2024-02-21T19:16:00Z') } = {}) {
    return new Clock(fixed);
  }

  #date;

  constructor(/** @type {string|number|Date|null} */ date) {
    this.#date = date;
  }

  date() {
    return this.#date ? new Date(this.#date) : new Date();
  }

  add(millis) {
    const now = this.date();
    this.#date = new Date(now.getTime() + millis);
  }
}
