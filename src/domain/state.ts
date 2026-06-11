// Copyright (c) 2026 Falko Schumann. All rights reserved. MIT license.

/**
 * Store a state.
 */
export class State<T> {
  #state: T;

  /**
   * Set the initial state.
   */
  constructor(initialState: T) {
    this.#state = initialState;
  }

  /**
   * Return the state.
   */
  get(): T {
    return this.#state;
  }

  /**
   * Update the state.
   */
  put(state: T) {
    this.#state = state;
  }
}
