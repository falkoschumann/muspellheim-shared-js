// TODO Declare reducer, state and action types
// TODO Declare listener and unsubscriber types

export function createStore(
  /** @type {function(any, any): any} */ reducer,
  preloadedState,
) {
  const initialState = preloadedState || reducer(undefined, { type: '@@INIT' });
  return new Store(reducer, initialState);
}

export class Store {
  #reducer;
  #state;
  #listeners = [];

  constructor(/** @type {function(any, any): any} */ reducer, initialState) {
    this.#reducer = reducer;
    this.#state = initialState;
  }

  getState() {
    return this.#state;
  }

  dispatch(action) {
    const oldState = this.#state;
    this.#state = this.#reducer(this.#state, action);
    if (oldState !== this.#state) {
      this.#emitChange();
    }
  }

  subscribe(/** @type {function(): void} */ listener) {
    this.#listeners.push(listener);
    return () => this.#unsubscribe(listener);
  }

  #emitChange() {
    this.#listeners.forEach((listener) => {
      // Unsubscribe replace listeners array with a new array, so we must double
      // check if listener is still subscribed.
      if (this.#listeners.includes(listener)) {
        listener();
      }
    });
  }

  #unsubscribe(listener) {
    this.#listeners = this.#listeners.filter((l) => l !== listener);
  }
}
