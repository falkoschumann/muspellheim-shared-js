// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * Simple global state management with store and reducer.
 *
 * This implementation is compatible with [Redux](https://redux.js.org). It is
 * intended to replace it with Redux if necessary, for example if the
 * application grows.
 *
 * @module
 */

/**
 * A reducer is a function that changes the state of the application based on an
 * action.
 *
 * @callback ReducerType
 * @param {StateType} state The current state of the application.
 * @param {ActionType} action The action to handle.
 * @returns {StateType} The next state of the application or the initial state
 *   if the state parameter is `undefined`.
 */

/**
 * The application state can be any object.
 *
 * @typedef {object} StateType
 */

/**
 * An action describe an command or an event that changes the state of the
 * application.
 *
 * An action can have any properties, but it should have a `type` property.
 *
 * @typedef {object} ActionType
 * @property {string} type A string that identifies the action.
 */

/**
 * A listener is a function that is called when the state of the store changes.
 *
 * @callback ListenerType
 */

/**
 * An unsubscriber is a function that removes a listener from the store.
 *
 * @callback UnsubscriberType
 */

/**
 * Creates a new store with the given reducer and optional preloaded state.
 *
 * @param {ReducerType} reducer The reducer function.
 * @param {StateType} [preloadedState] The optional initial state of the store.
 * @returns {Store} The new store.
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

  /**
   * Creates a new store with the given reducer and initial state.
   *
   * @param {ReducerType} reducer
   * @param {StateType} initialState
   */
  constructor(reducer, initialState) {
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
   * Updates the state of the store by dispatching an action to the reducer.
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
   * Subscribes a listener to store changes.
   *
   * @param {ListenerType} listener The listener to subscribe.
   * @returns {UnsubscriberType} A function that unsubscribes the listener.
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
