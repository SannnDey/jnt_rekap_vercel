type ActivityEvent = any;

const listeners = new Set<(data: ActivityEvent) => void>();

export function publishActivity(evt: ActivityEvent) {
  try {
    for (const l of Array.from(listeners)) {
      try { l(evt); } catch (e) { /* ignore listener error */ }
    }
  } catch (e) {
    // ignore
  }
}

export function subscribeActivity(listener: (data: ActivityEvent) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clearAllListeners() {
  listeners.clear();
}

export default { publishActivity, subscribeActivity, clearAllListeners };
