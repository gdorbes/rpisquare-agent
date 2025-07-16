// -------------------------------------------------------------------
// RPi² AGENT - DEV TOOLS
// -------------------------------------------------------------------
const DEBUG = true

// -------------------------------------------------------------------
//FUNCTIONS
/** ------------------------------------------------------------------
 * @function log
 * @description global customized timestamped log
 *              global constant required: DEBUG
 */
export const log = function () {
    if (DEBUG) {
        const date = new Date()
        let now = date.toLocaleTimeString() + "." + date.getMilliseconds().toLocaleString('en', {
            minimumIntegerDigits: 3,
            minimumFractionDigits: 0,
            useGrouping: false
        })
        let args = Array.prototype.concat.apply([now, "🔎"], arguments)
        console.log.apply(console, args)
    }
}
// -------------------------------------------------------------------
// EoF
// -------------------------------------------------------------------