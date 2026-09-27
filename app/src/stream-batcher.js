// Small, dependency-free batching boundary for native token callbacks.
export function createStreamBatcher(schedule, cancel, onFlush) {
  let pending = [];
  let scheduled = null;

  function flush() {
    if (scheduled !== null) {
      cancel(scheduled);
      scheduled = null;
    }
    if (pending.length === 0) return;
    const delta = pending.join("");
    pending = [];
    onFlush(delta);
  }

  return {
    push(text) {
      if (!text) return;
      pending.push(text);
      if (scheduled === null) scheduled = schedule(flush);
    },
    flush,
  };
}
