import { toRef } from "vue";

export function exposeReactiveState(state) {
  return Object.fromEntries(
    Object.keys(state).map((key) => [
      key,
      typeof state[key] === "function"
        ? (...args) => state[key](...args)
        : toRef(state, key)
    ])
  );
}