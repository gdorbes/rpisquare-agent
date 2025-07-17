// -------------------------------------------------------------------
// RPi² AGENT - HW INTERFACE
// -------------------------------------------------------------------
import {exec} from "child_process"
import * as os from "os"
import {log} from "./dev.mjs"

// -------------------------------------------------------------------
// CONSTANTS AND VARIABLES
// -------------------------------------------------------------------
const PLATFORM = os.platform()
const CMDS = {
    serial: {
        linux: {
            cmd: "cat /proc/cpuinfo | grep Serial",
            flt: str => {
                return str.split(":")[1].trim()
            }
        },
        darwin: {
            cmd: "system_profiler SPHardwareDataType",
            flt: str => {
                return str.match(/Serial Number.*: (.+)/)[1].trim()
            }
        }
    },
    model: {
        linux: {
            cmd: "cat /proc/cpuinfo | grep Model",
            flt: str => {
                return str.split(":")[1].trim()
            }
        },
        darwin: {
            cmd: "system_profiler SPHardwareDataType",
            flt: str => {
                return str.match(/Model Name.*: (.+)/)[1].trim()
            }
        }
    },
    iface: {
        linux: {
            cmd: "route | grep '^default' | grep -o '[^ ]*$'",
            flt: str => {
                return str.substring(0, 4)
            }
        },
        darwin: {
            cmd: "route -n get default | grep 'interface:' | grep -o '[^ ]*$'",
            flt: str => {
                return str.substring(0, 4)
            }
        }
    }
}

// -------------------------------------------------------------------
//FUNCTIONS
/** ------------------------------------------------------------------
 * @function run
 * @description Exec command in underlying os as Promise
 * @param {String} cmd
 * @return {Promise}
 */
const run = function (cmd) {
    return new Promise(resolve => {

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                resolve({
                    type: "error",
                    data: error
                })
                return
            }
            if (stderr) {
                resolve({
                    type: "stderr",
                    data: stderr
                })
                return
            }
            resolve({
                type: "stdout",
                data: stdout
            })
        })
    })
}

/** ------------------------------------------------------------------
 * @function runCmd
 * @description Exec command defined in CMDS
 * @param {String} name - Command name
 * @return {Promise}
 */
const runCmd = async name => {
    if (CMDS[name][PLATFORM]) {
        const result = await run(CMDS[name][PLATFORM].cmd)
        if (result.type === "stdout") {
            return CMDS[name][PLATFORM].flt(result.data)
        } else {
            log("serial cmd error:", result.type, result.data)
            return "undefined"
        }
    }

    log("unsupported platform:", PLATFORM)
    return "undefined"
}

/** ------------------------------------------------------------------
 * @function serial
 * @description Return hardware serial number
 * @return {Promise}
 */
export const serial = async () => {
    return await runCmd("serial")
}
/** ------------------------------------------------------------------
 * @function model
 * @description Return hardware model
 * @return {Promise}
 */
export const model = async () => {
    return await runCmd("model")
}

/** ------------------------------------------------------------------
 * @function iface
 * @description Return network interface
 * @return {Promise}
 */
export const iface = async () => {
    return await runCmd("iface")
}

// -------------------------------------------------------------------
// EoF
// -------------------------------------------------------------------