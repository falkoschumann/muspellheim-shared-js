// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from 'vitest';

import { createStore } from '../../lib/store.js';

describe('Store', () => {
  describe('Create store', () => {
    it('returns a store with initial state', () => {
      const store = new createStore(reducer, initialState);

      expect(store.getState()).toEqual(initialState);
    });

    it('initializes state with reducer', () => {
      const store = new createStore(reducer);

      expect(store.getState()).toEqual(initialState);
    });
  });

  describe('Dispatch', () => {
    it('updates the state', () => {
      const { store } = configure();

      store.dispatch({ type: 'user-changed', name: 'Bob' });

      expect(store.getState()).toEqual({ user: 'Bob' });
    });

    it('does not update the state when the action is unknown', () => {
      const { store } = configure();

      store.dispatch({ type: 'unknown-action' });

      expect(store.getState()).toEqual(preloadedState);
    });
  });

  describe('Subscribe', () => {
    it('notifies the listener when the state is changed', () => {
      const { store, listener } = configure();
      store.subscribe(listener);

      store.dispatch({ type: 'user-changed', name: 'Bob' });

      expect(listener.getCalledTimes()).toBe(1);
    });

    it('does not notify the listener when the state is not changed', () => {
      const { store, listener } = configure();
      store.subscribe(listener);

      store.dispatch({ type: 'unknown-action' });

      expect(listener.getCalledTimes()).toBe(0);
    });

    it('does not notify the listener when the listener is unsubscribed', () => {
      const { store, listener } = configure();
      const unsubscribe = store.subscribe(listener);

      unsubscribe();
      store.dispatch({ type: 'user-changed', name: 'Bob' });

      expect(listener.getCalledTimes()).toBe(0);
    });

    it('ignores an unsubscribed listener', () => {
      const { store } = configure();
      const listener1 = createListener(() => unsubscribe2());
      const listener2 = createListener();
      store.subscribe(listener1);
      const unsubscribe2 = store.subscribe(listener2);

      store.dispatch({ type: 'user-changed', name: 'Bob' });

      expect(store.getState()).toEqual({ user: 'Bob' });
      expect(listener2.getCalledTimes()).toBe(0);
    });
  });
});

const initialState = { user: '' };
const preloadedState = { user: 'Alice' };

function reducer(state = initialState, action) {
  switch (action.type) {
    case 'user-changed':
      return { ...state, user: action.name };
    default:
      return state;
  }
}

function configure() {
  const store = new createStore(reducer, preloadedState);
  const listener = createListener();
  return { store, listener };
}

function createListener(action = () => {}) {
  let calls = 0;
  const listener = () => {
    calls++;
    action();
  };
  listener.getCalledTimes = () => calls;
  return listener;
}
