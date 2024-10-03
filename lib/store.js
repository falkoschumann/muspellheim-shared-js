/**
 * A function that returns the next state, given the current state and the
 * action to handle.
 *
 * @callback ReducerType
 * @param {StateType} state The current state of the application.
 * @param {ActionType} action The action to handle.
 * @returns {StateType} The next state of the application. Returns the initial
 *   state if the state is `undefined`.
 */

/**
 * Any object that represents the state of the application.
 *
 * @typedef {object} StateType
 */

/**
 * Any object that represents an action that can be dispatched to the store.
 *
 * @typedef {object} ActionType
 * @property {string} type A string that identifies the action.
 */

/**
 * A function that listens to the store changes.
 *
 * @callback ListenerType
 * @returns {undefined}
 */

/**
 * A function that unsubscribes a listener from the store.
 *
 * @callback UnsubscribeType
 * @returns {undefined}
 */

/**
 * Creates a new store with the given reducer and optional preloaded state.
 *
 * @param {ReducerType} reducer The reducer function.
 * @param {StateType} [preloadedState] The initial state of the store.
 * @returns {Store} A new store.
 */
export function createStore(reducer, preloadedState) {
  const initialState = preloadedState || reducer(undefined, { type: '@@INIT' });
  return new Store(reducer, initialState);
}

/**
 * A simple store compatible with [Redux](https://redux.js.org/api/store).
 */
export class Store {
  #reducer;
  #state;
  #listeners = [];

  /** @hideconstructor */
  constructor(/** @type {ReducerType} */ reducer, initialState) {
    this.#reducer = reducer;
    this.#state = initialState;
  }

  /**
   * Returns the current state of the store.
   *
   * @returns {StateType} The current state of the store.
   */
  getState() {
    return this.#state;
  }

  /**
   * Dispatches an action to the store. The state will be updated and all the
   * listeners will be notified.
   *
   * @param {ActionType} action The action to dispatch.
   */
  dispatch(action) {
    const oldState = this.#state;
    this.#state = this.#reducer(this.#state, action);
    if (oldState !== this.#state) {
      this.#emitChange();
    }
  }

  /**
   * Subscribes a listener to the store changes.
   *
   * @param {ListenerType} listener The listener to subscribe.
   * @returns {UnsubscribeType} A function that unsubscribes the listener
   */
  subscribe(listener) {
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
