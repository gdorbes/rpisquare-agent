// -------------------------------------------------------------------
// RPi² AGENT - DEV TOOLS
// -------------------------------------------------------------------
//FUNCTIONS
/** ------------------------------------------------------------------
 * @function log
 * @description Global customized timestamped log
 *              First call to enable/disable console with boolean parameter
 */
export const log = function () {

    // First call to enable/disable console
    if (log.active === undefined && typeof arguments[0] === "boolean") {
        log.active = arguments[0]
        return
    }

    // Further calls
    if (log.active) {
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