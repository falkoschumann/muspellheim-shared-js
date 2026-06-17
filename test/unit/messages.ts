// Copyright (c) 2026 Falko Schumann. All rights reserved. MIT license.

export class FooMessage {
  readonly type = "foo";
  readonly data;

  constructor({ value = 42 }: { value?: number } = {}) {
    this.data = { value };
  }
}

export class BarMessage {
  readonly type = "bar";
  readonly data;

  constructor({ value = "lorem ipsum" }: { value?: string } = {}) {
    this.data = { value };
  }
}

export class TestResponse {
  readonly value: string;

  constructor(value = "foobar") {
    this.value = value;
  }
}
