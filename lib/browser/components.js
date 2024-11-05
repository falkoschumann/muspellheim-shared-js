// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * @import { StateType, Store } from '../store.js'
 * @import { TemplateResult } from 'lit-html'
 */

import { html, render } from 'lit-html';

/**
 * Base class for a custom element rendered with
 * [lit-html](https://lit.dev/docs/libraries/standalone-templates/).
 */
export class Component extends HTMLElement {
  /**
   * Updates the component after inserting it into the DOM.
   */
  connectedCallback() {
    this.updateView();
  }

  /**
   * Called when the component is removed from the DOM.
   */
  disconnectedCallback() {}

  /**
   * Updates the component.
   *
   * Renders the view into the target element.
   *
   * @see Component#getView
   * @see Component#getRenderTarget
   */
  updateView() {
    if (!this.isConnected) {
      // Skip rendering, e.g. when setting properties before inserting into DOM.
      return;
    }

    render(this.getView(), this.getRenderTarget());
  }

  /**
   * Returns the view as template created with `html` from lit-html.
   *
   * @returns {TemplateResult} The view.
   */
  getView() {
    return html``;
  }

  /**
   * Returns the target element to render the view into. The default is `this`.
   *
   * @returns {HTMLElement|DocumentFragment} The target element.
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

  static initStore(/** @type {Store} */ store) {
    Container.#store = store;
  }

  /** @type {function(): void} */ #unsubscribeStore;

  constructor() {
    super();
    this.state = {};
  }

  get store() {
    return Container.#store;
  }

  /** @override */
  connectedCallback() {
    this.#unsubscribeStore = this.store.subscribe(() => this.updateView());
    super.connectedCallback();
  }

  /** @override */
  disconnectedCallback() {
    this.#unsubscribeStore();
    super.disconnectedCallback();
  }

  /** @override */
  updateView() {
    this.state = this.extractState(this.store.getState());
    super.updateView();
  }

  /**
   * Extract a subset of the state for the component. Default is the entire
   * state.
   *
   * @param {StateType} state The state of the store.
   * @returns {StateType} The state for the component.
   */
  extractState(state) {
    return state;
  }
}
