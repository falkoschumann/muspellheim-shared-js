/**
 * @module
 */

/**
 * @import { Store } from '../store.js'
 */

import { html, render } from 'lit-html';

/**
 * Base class for components.
 */
export class Component extends HTMLElement {
  connectedCallback() {
    this.updateView();
  }

  disconnectedCallback() {}

  updateView() {
    if (!this.isConnected) {
      // Skip rendering, e.g. when setting properties before inserting into DOM.
      return;
    }

    render(this.getView(), this.getRenderTarget());
  }

  getView() {
    return html``;
  }

  getRenderTarget() {
    return this;
  }
}

/**
 * Base class for components that use a store.
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

  connectedCallback() {
    this.#unsubscribeStore = this.store.subscribe(() => this.updateView());
    super.connectedCallback();
  }

  disconnectedCallback() {
    this.#unsubscribeStore();
    super.disconnectedCallback();
  }

  extractState(state) {
    return state;
  }

  updateView() {
    this.state = this.extractState(this.store.getState());
    super.updateView();
  }
}
