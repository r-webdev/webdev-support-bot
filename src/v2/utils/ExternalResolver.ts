/* eslint-disable @typescript-eslint/explicit-member-accessibility */
export class ExternalResolver<T> extends Promise<T> {
  readonly #resolve: (value: T) => void;

  readonly #reject: (reason: unknown) => void;

  #resolved = false;

  #rejected = false;

  public constructor() {
    let resolver;
    let rejector;

    super((resolve, reject) => {
      resolver = resolve;
      rejector = reject;
    });

    this.#resolve = resolver;
    this.#reject = rejector;
  }

  public get settled() {
    return this.#resolved || this.#rejected;
  }

  public get resolved() {
    return this.#resolved;
  }

  public get rejected() {
    return this.#rejected;
  }

  public resolve(value: T): void {
    this.#resolved = true
    this.#resolve(value);
  }

  public reject(reason: unknown): void {
    this.#rejected = true
    this.#reject(reason);
  }

  public static get [Symbol.species](): PromiseConstructor {
    return Promise;
  }
}
