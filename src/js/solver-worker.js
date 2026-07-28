/** 
 * Runs the exponential best-route solver off the main thread so that page never freezes. 
 */
import { solveRoute } from './search.js';



self.onmessage = (event) => {
    const board = event.data;
    try {
        const outcome = solveRoute(board);
        if (outcome.ok) {
            self.postMessage({ ok: true, result: outcome, exact: outcome.exact });
        } else {
            self.postMessage({ ok: false, error: outcome.reason });
        }
    } catch (err) {
        self.postMessage({ ok: false, error: err.message });
    }
};