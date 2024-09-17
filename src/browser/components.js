/**
 * @typedef {Object} Store
 * @property {()=>any} getState
 * @property {(action:any)=>void} dispatch
 * @property {(listener:()=>void)=>()=>void} subscribe
 */

import { html, render } from 'lit-html';

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

export class Container extends Component {
  /** @type {Store} */ static #store;

  static initStore(/** @type {Store} */ store) {
    Container.#store = store;
  }

  /** @type {Function} */ #unsubscribeStore;

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
