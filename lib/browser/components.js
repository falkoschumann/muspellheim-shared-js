// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * Contains a pattern to implement custom elements with
 * [lit-html](https://lit.dev/docs/libraries/standalone-templates/).
 *
 * @module
 */

/**
 * @import { ActionType, StateType, Store } from '../store.js'
 * @import { TemplateResult } from 'lit-html'
 */

import { html, render } from 'lit-html';

/**
 * Base class for a custom element rendered with `lit-html`.
 */
export class Component extends HTMLElement {
  /**
   * Updates the view after this component is inserted into the DOM.
   *
   * Called when this component is inserted into the DOM. Override this method
   * to register event listeners. Don't forget to call the super method.
   */
  connectedCallback() {
    this.updateView();
  }

  /**
   * Currently does nothing.
   *
   * Called when this component is removed from the DOM. Override this method to
   * remove event listeners. Don't forget to call the super method.
   */
  disconnectedCallback() {}

  /**
   * Updates this component.
   *
   * Renders the view into the target element.
   *
   * @see module:browser/components.Component#getView
   * @see module:browser/components.Component#getRenderTarget
   */
  updateView() {
    if (!this.isConnected) {
      // Skip rendering, e.g. when setting properties before inserting into DOM.
      return;
    }

    render(this.getView(), this.getRenderTarget());
  }

  /**
   * Returns the view to render when this component is updated.
   *
   * The view is a template created with `html` from lit-html. Override this
   * method to return the view. The default is an empty view.
   *
   * @return {TemplateResult} The view.
   */
  getView() {
    return html``;
  }

  /**
   * Returns the target element of this component to render the view into.
   *
   * The default is `this`.
   *
   * @return {HTMLElement|DocumentFragment} The target element.
   */
  getRenderTarget() {
    return this;
  }
}

/**
 * Base class for custom elements that use a store.
 *
 * @extends {Component}
 * @see Store
 */
export class Container extends Component {
  /** @type {Store} */ static #store;

  /**
   * Initializes the store for all containers.
   *
   * Must be call before any container is inserted into the DOM.
   *
   * @param {Store} store The store to use.
   */
  static initStore(store) {
    Container.#store = store;
  }

  /** @type {function(): void} */ #unsubscribeStore;

  /**
   * Initializes this container with an empty state `{}`.
   */
  constructor() {
    super();
    this.state = {};
  }

  /**
   * Returns the store.
   *
   * @type {Store}
   * @deprecated
   */
  get store() {
    return Container.#store;
  }

  /**
   * Dispatches an action to the store.
   *
   * @param {ActionType} action The action to dispatch.
   */
  dispatch(action) {
    this.store.dispatch(action);
  }

  /**
   * Subscribes to the store and update the view when the state changes.
   *
   * Don't forget to call the super method when overriding this method.
   *
   * @override
   */
  connectedCallback() {
    this.#unsubscribeStore = this.store.subscribe(() => this.updateView());
    super.connectedCallback();
  }

  /**
   * Unsubscribes from the store.
   *
   * Don't forget to call the super method when overriding this method.
   *
   * @override
   */
  disconnectedCallback() {
    this.#unsubscribeStore();
    super.disconnectedCallback();
  }

  /**
   * Updates this container with the current state from the store before
   * updating the view.
   *
   * @override
   */
  updateView() {
    this.state = this.extractState(this.store.getState());
    super.updateView();
  }

  /**
   * Extracts a subset of the state for this container.
   *
   * Default is the entire state.
   *
   * @param {StateType} state The state of the store.
   * @return {StateType} The state for the container.
   */
  extractState(state) {
    return state;
  }
}
