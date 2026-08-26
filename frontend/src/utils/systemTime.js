/**
 * System Time Utility — Feature: Dev Date Override
 *
 * Reads a date/time override from localStorage (set by the Admin Dev Tools panel).
 * All components that need "current time" for deadline checks should use
 * getSystemTime() instead of new Date(), so tests can simulate any date.
 *
 * The override only lives in localStorage — no server state is changed.
 * It resets automatically when the browser is closed (sessionStorage variant),
 * but we use localStorage so it persists across page refreshes during a test session.
 *
 * Storage key: 'dev_time_override'
 * Value format: ISO string, e.g. "2026-12-01T10:30:00"
 */

const STORAGE_KEY = 'dev_time_override';

/** Returns the current effective Date (override if set, otherwise real now). */
export const getSystemTime = () => {
    try {
        const override = localStorage.getItem(STORAGE_KEY);
        if (override) {
            const d = new Date(override);
            if (!isNaN(d.getTime())) return d;
        }
    } catch {
        // localStorage unavailable — fall through
    }
    return new Date();
};

/** Sets the dev time override. Pass an ISO string or Date object. */
export const setSystemTimeOverride = (dateOrString) => {
    const iso = dateOrString instanceof Date
        ? dateOrString.toISOString().slice(0, 16) // "YYYY-MM-DDTHH:mm"
        : dateOrString;
    localStorage.setItem(STORAGE_KEY, iso);
};

/** Clears the override — reverts to real system time. */
export const clearSystemTimeOverride = () => {
    localStorage.removeItem(STORAGE_KEY);
};

/** Returns true if an override is currently active. */
export const hasSystemTimeOverride = () => {
    try {
        return !!localStorage.getItem(STORAGE_KEY);
    } catch {
        return false;
    }
};

/** Returns the raw override string (for displaying in the UI), or null. */
export const getSystemTimeOverrideString = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) || null;
    } catch {
        return null;
    }
};
