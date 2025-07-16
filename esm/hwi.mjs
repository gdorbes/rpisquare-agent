// -------------------------------------------------------------------
// RPi² AGENT - HW INTERFACE
// -------------------------------------------------------------------
import {exec} from "child_process"
import * as os from "os"
import {log} from "./dev.mjs"

// -------------------------------------------------------------------
// CONSTANTS AND VARIABLES
// -------------------------------------------------------------------
export const platform = os.platform()
// -------------------------------------------------------------------
//FUNCTIONS
/** ------------------------------------------------------------------
 * @function run
 * @description Exec command in underlying os as Promise
 * @param {String} cmd
 * @return {Promise}
 */
export const run = function (cmd) {
    return new Promise(resolve => {
        try {
            exec(cmd, (err, stdout, stderr) => {
                if (stderr)
                    throw new Error((stderr))
                else
                    resolve(stdout)
            })
        } catch (err) {
            log("run error:", err)
            resolve(false)
        }
    })
}

/** ------------------------------------------------------------------
 * @function serial
 * @description Return hardware serial number
 * @return {Promise}
 */
export const serial = async () => {
    switch (os.platform()) {
        case "linux":
            const info = await run("cat /proc/cpuinfo | grep Serial")
            return info.split(":")[1].trim()
        case "darwin":
            const hw = await run("system_profiler SPHardwareDataType")
            return hw.match(/Serial Number.*: (.+)/)[1].trim()
        default:
    }
}
/** ------------------------------------------------------------------
 * @function model
 * @description Return hardware model
 * @return {Promise}
 */
export const model = async () => {
    switch (os.platform()) {
        case "linux":
            const info = await run("cat /proc/cpuinfo | grep Model")
            return info.split(":")[1].trim()
        case "darwin":
            const hw = await run("system_profiler SPHardwareDataType")
            return hw.match(/Model Name.*: (.+)/)[1].trim()
        default:
    }
}

/** ------------------------------------------------------------------
 * @function networkInterface
 * @description Return network interface
 * @return {Promise}
 */
export const networkInterface = async () => {
    let iface = "none"
    switch (os.platform()) {
        case "linux":
            iface = await run("route | grep '^default' | grep -o '[^ ]*$'")
            break
        case "darwin":
            iface = await run("route -n get default | grep 'interface:' | grep -o '[^ ]*$'")
    }
    return iface.substring(0, 4)
}

// -------------------------------------------------------------------
// EoF
// -------------------------------------------------------------------