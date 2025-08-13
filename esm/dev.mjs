// -------------------------------------------------------------------
// RPi² AGENT - DEV TOOLS
// -------------------------------------------------------------------
// CONSTANTS AND VARIABLES
// -------------------------------------------------------------------
export let debug = true

// -------------------------------------------------------------------
// FUNCTIONS
/** ------------------------------------------------------------------
 * @function log
 * @description Global customized timestamped console.log
 *              Requires global variable `debug`
 */
export const log = function () {

    if (debug) {
        const date = new Date()
        const now = date.toLocaleTimeString() + "." + date.getMilliseconds().toLocaleString('en', {
            minimumIntegerDigits: 3,
            minimumFractionDigits: 0,
            useGrouping: false
        })
        console.log.apply(console, Array.prototype.concat.apply([now, "🔎"], arguments))
    }
}

// -------------------------------------------------------------------
// EoF
// -------------------------------------------------------------------