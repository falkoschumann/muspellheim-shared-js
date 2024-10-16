import { Enum } from './enum.js';

// TODO Create gauges (can increment and decrement)
// TODO Create timers (total time, average time and count)
// TODO Publish metrics to a server via HTTP
// TODO Provide metrics for Prometheus

export class MeterRegistry {
  static create() {
    return new MeterRegistry();
  }

  #meters = [];

  get meters() {
    return this.#meters;
  }

  counter(name, tags) {
    const id = MeterId.create({ name, tags, type: MeterType.COUNTER });
    /** @type {Counter} */ let meter = this.#meters.find((meter) =>
      meter.id.equals(id),
    );
    if (!meter) {
      meter = new Counter(id);
      this.#meters.push(meter);
    }

    // TODO validate found meter is a counter
    return meter;
  }
}

export class Meter {
  #id;

  constructor(/** @type {MeterId} */ id) {
    // TODO validate parameters are not null
    this.#id = id;
  }

  get id() {
    return this.#id;
  }
}

export class Counter extends Meter {
  #count = 0;

  constructor(/** @type {MeterId} */ id) {
    super(id);
    // TODO validate type is counter
  }

  count() {
    return this.#count;
  }

  increment(amount = 1) {
    this.#count += amount;
  }
}

export class MeterId {
  static create({ name, tags = [], type }) {
    return new MeterId(name, tags, type);
  }

  #name;
  #tags;
  #type;

  constructor(
    /** @type {string} */ name,
    /** @type {string[]} */ tags,
    /** @type {MeterType} */ type,
  ) {
    // TODO validate parameters are not null
    this.#name = name;
    this.#tags = Array.from(tags).sort();
    this.#type = type;
  }

  get name() {
    return this.#name;
  }

  get tags() {
    return this.#tags;
  }

  get type() {
    return this.#type;
  }

  equals(other) {
    return (
      this.name === other.name &&
      this.tags.length === other.tags.length &&
      this.tags.every((tag, index) => tag === other.tags[index])
    );
  }
}

export class MeterType extends Enum {
  static COUNTER = new MeterType('COUNTER', 0);
  static GAUGE = new MeterType('GAUGE', 1);
  static TIMER = new MeterType('TIMER', 2);
}
