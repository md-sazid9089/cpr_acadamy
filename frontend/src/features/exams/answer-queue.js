export function createAnswerQueue(save, onStatus) {
  const pending = new Map();
  let active = null;
  let disposed = false;

  function flush() {
    if (disposed) return Promise.resolve();
    if (active) return active;
    active = (async () => {
      while (pending.size && !disposed) {
        const [questionId, answer] = pending.entries().next().value;
        onStatus('saving');
        try {
          await save({ questionId, answer });
          if (pending.get(questionId) === answer) pending.delete(questionId);
        } catch {
          if (!disposed) onStatus('error');
          return;
        }
      }
      if (!disposed) onStatus('saved');
    })().finally(() => { active = null; });
    return active;
  }

  return {
    enqueue(questionId, answer) {
      if (disposed) return;
      pending.set(questionId, answer);
      void flush();
    },
    flush,
    get hasPending() { return pending.size > 0; },
    dispose() { disposed = true; pending.clear(); },
  };
}