/** 
 * Runs the exponential best-route solver off the main thread so that page never freezes. 
 */
import { findBestRoute } from './search.js';



self.onmessage = (event) => {
    const board = event.data;

    try {
        const result = findBestRoute(board);
        self.postMessage({ ok: true, result });
    } catch (err) {
        self.postMessage({ ok: false, error: err.message });
    }
};