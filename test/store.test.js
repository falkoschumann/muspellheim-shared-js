import { describe, expect, test } from '@jest/globals';

import { createStore } from '../src/store.js';

describe('Store', () => {
  describe('Create store', () => {
    test('Creates store with initial state', () => {
      const store = new createStore(reducer, initialState);

      expect(store.getState()).toEqual(initialState);
    });

    test('Creates store and initializes state with reducer', () => {
      const store = new createStore(reducer);

      expect(store.getState()).toEqual(initialState);
    });
  });

  describe('Subscribe', () => {
    test('Does not emit event, if state is not changed', () => {
      const { store } = configure();
      let calls = 0;
      const listener = () => calls++;
      store.subscribe(listener);

      store.dispatch({ type: 'unknown-action' });

      expect(store.getState()).toEqual({ user: 'Alice' });
      expect(calls).toBe(0);
    });

    test('Emits event, if state is changed', () => {
      const { store } = configure();
      let calls = 0;
      const listener = () => calls++;
      store.subscribe(listener);

      store.dispatch({ type: 'user-changed', name: 'Bob' });

      expect(store.getState()).toEqual({ user: 'Bob' });
      expect(calls).toBe(1);
    });

    test('Does not emit event, if listener is unsubscribed', () => {
      const { store } = configure();
      let calls = 0;
      const listener = () => calls++;
      const unsubscribe = store.subscribe(listener);

      unsubscribe();
      store.dispatch({ type: 'user-changed', name: 'Bob' });

      expect(store.getState()).toEqual({ user: 'Bob' });
      expect(calls).toBe(0);
    });

    test('Ignores unsubscribed listener', () => {
      const { store } = configure();
      let calls = 0;
      let unsubscribe2;
      const listener1 = () => {
        calls++;
        unsubscribe2();
      };
      const listener2 = () => calls++;
      store.subscribe(listener1);
      unsubscribe2 = store.subscribe(listener2);

      store.dispatch({ type: 'user-changed', name: 'Bob' });

      expect(store.getState()).toEqual({ user: 'Bob' });
      expect(calls).toBe(1);
    });
  });
});

const initialState = { user: '' };

function reducer(state = initialState, action) {
  switch (action.type) {
    case 'user-changed':
      return { ...state, user: action.name };
    default:
      return state;
  }
}

function configure() {
  const store = new createStore(reducer, { user: 'Alice' });
  return { store };
}
