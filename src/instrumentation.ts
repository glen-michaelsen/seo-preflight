/**
 * Node.js v22+ exposes `localStorage` as a global but it doesn't work
 * without a `--localstorage-file` path. Libraries like next-auth check
 * `typeof localStorage !== "undefined"` to detect browser environments —
 * on Node.js v25 that check is true but calling getItem() throws.
 *
 * This instrumentation file runs before any request handler and resets
 * localStorage to undefined so server-side code behaves correctly.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Object.defineProperty(globalThis, "localStorage", {
      value: undefined,
      writable: true,
      configurable: true,
    });
  }
}
