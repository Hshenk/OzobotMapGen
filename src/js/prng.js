
export function createRng(seed) {
    let state = seed >>> 0;

    function next() {
        state = (state + 0x6D2B79F5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    return {
        next, 
        randInt(min, max) { return (min + Math.floor(next() * (max - min + 1))); },
        choice(items) {
            if (items.length === 0){ throw new Error('choice() called on empty array') };
            return items[Math.floor(next() * items.length)]

        },
        shuffle(items) {
            
            for (let i = items.length - 1; i > 0; i--) {
                const k = Math.floor(next() * (i + 1));
                [items[k], items[i]] = [items[i], items[k]]
            }
            return items;
        },
    }
   
}