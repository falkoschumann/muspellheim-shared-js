export class StopWatch {
  #startTime;
  #stopTime;

  start() {
    this.#startTime = Date.now();
  }

  stop() {
    this.#stopTime = Date.now();
  }

  getTotalTimeMillis() {
    return this.#stopTime - this.#startTime;
  }

  getTotalTimeSeconds() {
    return this.getTotalTimeMillis / 1000;
  }
}
