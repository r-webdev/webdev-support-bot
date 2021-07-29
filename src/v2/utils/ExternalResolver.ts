/* eslint-disable @typescript-eslint/explicit-member-accessibility */
export class ExternalResolver<T> extends Promise<T> {
     readonly #resolve: (value:T) => void

     readonly #reject: (reason: unknown) => void

    public constructor() {
      let resolver
      let rejector

      super((resolve,reject) => {
        resolver = resolve
        rejector = reject
      })

      this.#resolve = resolver
      this.#reject = rejector
    };

    public resolve(value: T): void {
      this.#resolve(value)
    }

    public reject(reason: unknown): void {
      this.#reject(reason)
    }

    public static get [Symbol.species] (): PromiseConstructor {
      return Promise
    }
}
