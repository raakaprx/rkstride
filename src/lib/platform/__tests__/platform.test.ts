import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { hapticTap, hapticDone, hapticWarn, useOnlineStatus } from '..';

/** jsdom exposes navigator as a getter-only property, so stubs go through defineProperty. */
function stubNavigator(value: object) {
  Object.defineProperty(window, 'navigator', { value, configurable: true, writable: true });
}

describe('platform haptics', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    stubNavigator({ ...window.navigator });
  });

  it('sends the 15ms pulse on a primary tap', () => {
    const vibrate = vi.fn().mockReturnValue(true);
    stubNavigator({ vibrate });

    hapticTap();
    expect(vibrate).toHaveBeenCalledWith([15]);
  });

  it('uses longer, multi-pulse patterns for done and warn', () => {
    const vibrate = vi.fn().mockReturnValue(true);
    stubNavigator({ vibrate });

    hapticDone();
    hapticWarn();

    expect(vibrate).toHaveBeenNthCalledWith(1, [25, 60, 25]);
    expect(vibrate).toHaveBeenNthCalledWith(2, [40, 80, 40]);
  });

  it('never throws when the device has no vibration motor', () => {
    stubNavigator({});

    expect(() => {
      hapticTap();
      hapticDone();
      hapticWarn();
    }).not.toThrow();
  });

  it('never throws when the browser blocks vibrate outside a user gesture', () => {
    stubNavigator({
      vibrate: () => {
        throw new Error('blocked by user gesture policy');
      },
    });

    expect(() => hapticWarn()).not.toThrow();
  });
});

describe('useOnlineStatus', () => {
  it('reflects the initial navigator.onLine value', () => {
    stubNavigator({ onLine: false });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it('tracks offline and online events after mount', () => {
    stubNavigator({ onLine: true });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });
});
