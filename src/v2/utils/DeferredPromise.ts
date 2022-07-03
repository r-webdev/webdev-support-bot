export class DeferredPromise<T> extends Promise<T> {
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

  public static get [Symbol.species](): PromiseConstructor {
    return Promise;
  }

  public get settled(): boolean {
    return this.#resolved || this.#rejected;
  }

  public get resolved(): boolean {
    return this.#resolved;
  }

  public get rejected(): boolean {
    return this.#rejected;
  }

  public resolve(value: T): void {
    this.#resolved = true;
    this.#resolve(value);
  }

  public reject(reason: unknown): void {
    this.#rejected = true;
    this.#reject(reason);
  }
}
