/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the function
 *
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('Searching for:', query);
 * }, 300);
 *
 * debouncedSearch('hello'); // Will only execute after 300ms of no calls
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;

    return function debounced(...args: Parameters<T>) {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            func(...args);
            timeoutId = null;
        }, wait);
    };
}

/**
 * Creates a debounced function that also executes immediately on the first call,
 * then debounces subsequent calls.
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the function that executes immediately on first call
 *
 * @example
 * const debouncedSave = debounceLeading((data: any) => {
 *   console.log('Saving:', data);
 * }, 500);
 *
 * debouncedSave(data); // Executes immediately
 * debouncedSave(data); // Debounced (waits 500ms)
 */
export function debounceLeading<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastCallTime: number = 0;

    return function debounced(...args: Parameters<T>) {
        const now = Date.now();
        const timeSinceLastCall = now - lastCallTime;

        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }

        // Execute immediately if enough time has passed
        if (timeSinceLastCall >= wait) {
            func(...args);
            lastCallTime = now;
        } else {
            // Otherwise, debounce
            timeoutId = setTimeout(() => {
                func(...args);
                lastCallTime = Date.now();
                timeoutId = null;
            }, wait);
        }
    };
}
