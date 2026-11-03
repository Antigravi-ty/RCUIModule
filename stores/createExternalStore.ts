export interface ExternalStoreCore<T> {
  getSnapshot: () => T;
  setState: (updater: T | ((prev: T) => T), shouldNotify?: boolean) => T;
  subscribe: (listener: () => void) => () => boolean;
  notify: () => void;
  getListenerCount: () => number;
}

export function createExternalStore<T>(
  initialState: T,
  options?: {
    onNotify?: (state: T) => void;
    onFirstSubscribe?: (state: T, replaceState: (next: T) => void) => void;
  }
): ExternalStoreCore<T> {
  let state = initialState;
  const listeners = new Set<() => void>();

  const replaceState = (next: T) => {
    state = next;
  };

  const notify = () => {
    options?.onNotify?.(state);
    listeners.forEach((cb) => cb());
  };

  return {
    getSnapshot: () => state,
    setState: (updater, shouldNotify = true) => {
      state = typeof updater === 'function' ? (updater as (prev: T) => T)(state) : updater;
      if (shouldNotify) {
        notify();
      }
      return state;
    },
    subscribe: (listener: () => void) => {
      if (listeners.size === 0 && options?.onFirstSubscribe) {
        options.onFirstSubscribe(state, replaceState);
      }
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    notify,
    getListenerCount: () => listeners.size,
  };
}
