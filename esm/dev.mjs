// -------------------------------------------------------------------
// RPi² AGENT - DEV TOOLS
// -------------------------------------------------------------------
let showLog = true
// -------------------------------------------------------------------
//FUNCTIONS
/** ------------------------------------------------------------------
 * @function log
 * @description global customized timestamped log
 *              global constant required: DEBUG
 */
export const log = function () {
    if (showLog) {
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
/** ------------------------------------------------------------------
 * @function logInit
 * @description global customized timestamped log
 *              global constant required: DEBUG
 */
export const logInit = mode => {
    showLog = true
    mode ? log("debug mode enabled") : log("debug mode disabled")
    showLog = mode
}