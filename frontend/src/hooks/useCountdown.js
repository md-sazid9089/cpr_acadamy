import { useEffect, useRef, useState } from 'react';

/**
 * Counts down from `seconds`, ticking once per second. Used by the exam auto
 * timer and the OTP resend cooldown.
 *
 * @param {number} seconds        Starting value.
 * @param {Object} [options]
 * @param {boolean} [options.autoStart=true]
 * @param {() => void} [options.onExpire] Fired once when the timer hits zero.
 */
export function useCountdown(seconds, { autoStart = true, onExpire } = {}) {
  const [remaining, setRemaining] = useState(seconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const startRef = useRef(Date.now());
  const initialSecondsRef = useRef(seconds);

  useEffect(() => {
    setRemaining(seconds);
    startRef.current = Date.now();
    initialSecondsRef.current = seconds;
  }, [seconds]);

  useEffect(() => {
    if (!isRunning) return undefined;
    const id = setInterval(() => {
      const elapsed = Math.round((Date.now() - startRef.current) / 1000);
      const value = Math.max(0, initialSecondsRef.current - elapsed);
      setRemaining(value);
      if (value <= 0) {
        clearInterval(id);
        setIsRunning(false);
        onExpireRef.current?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  return {
    remaining,
    isRunning,
    isExpired: remaining === 0,
    start: () => setIsRunning(true),
    pause: () => setIsRunning(false),
    reset: (next = seconds) => {
      setRemaining(next);
      startRef.current = Date.now();
      initialSecondsRef.current = next;
      setIsRunning(true);
    },
  };
}
