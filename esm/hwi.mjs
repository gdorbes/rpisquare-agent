// -------------------------------------------------------------------
// RPi² AGENT - HW INTERFACE
// -------------------------------------------------------------------
import {exec} from "child_process"
import * as os from "os"
import {log} from "./dev.mjs"

// -------------------------------------------------------------------
// CONSTANTS AND VARIABLES
// -------------------------------------------------------------------
const MY_COMMANDS = {
    serial: {
        linux: {
            // Command to execute
            cmd: "cat /proc/cpuinfo | grep Serial",
            // Filter applied to result
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

export let hw = {}
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
 * @description Exec command defined in MY_COMMANDS
 * @param {String} name - Command name
 * @return {Promise}
 */
const runCmd = async name => {
    const platform = os.platform()
    if (MY_COMMANDS[name][platform]) {
        const returned = await run(MY_COMMANDS[name][platform].cmd)
        if (returned.type === "stdout") {
            return MY_COMMANDS[name][platform].flt(returned.data)
        } else {
            log("serial cmd error:", returned.type, returned.data)
            return "undefined"
        }
    }

    log("unsupported platform:", platform)
    return "undefined"
}

/** ------------------------------------------------------------------
 * @function hw.serial
 * @description Return hardware serial number
 * @return {Promise}
 */
hw.serial = async () => {
    return await runCmd("serial")
}
/** ------------------------------------------------------------------
 * @function hw.model
 * @description Return hardware model and store if for further call
 * @return {Promise}
 */
hw.model = async () => {

    if (!hw.model.value) {
        hw.model.value = await runCmd("model")
        hw.model.value = hw.model.value.toLowerCase()
    }
    return hw.model.value
}

/** ------------------------------------------------------------------
 * @function hw.iface
 * @description Return network interface
 * @return {Promise}
 */
hw.iface = async () => {
    return await runCmd("iface")
}
/** ------------------------------------------------------------------
 * @function hw.name
 * @description Return hardware name
 * @return {Promise}
 */
hw.name = async () => {
    let model = await hw.model()
    model = model.toLowerCase()
    if (model.search("raspberry") !== -1) {
        return "raspberry"
    }
    if (model.search("mac") !== -1) {
        return "mac"
    }
    return "unknown"
}
/** ------------------------------------------------------------------
 * @function osInfo
 * @description Return OS version and codename
 * @return {Promise}
 */
hw.os = async () => {
    const hwName = await hw.name()
    const response = {
        version: "unknown",
        name: "unknown"
    }
    let returned
    if (hwName === "mac") {
        const latestVersions = {
            "15": "sequoia",
            "14": "sonoma",
            "13": "ventura",
            "12": "monterey",
            "11": "big sur",
        }
        returned = await run("sw_vers -productVersion")
        if (returned.type === "stdout") {
            response.version = returned.data.replace("\n", "").trim()
            const known = latestVersions[response.version.substring(0, 2)]
            known ? response.name = known : false
        }
    }
    if (hwName === "raspberry") {
        returned = await run("cat /etc/os-release")
        if (returned.type === "stdout") {

            const lines = returned.data.split("\n")
            const info = {}
            lines.forEach(line => {
                const [key, value] = line.split("=")
                if (key && value) {
                    info[key] = value.replace(/"/g, "");
                }
            })
            response.version = info.VERSION_ID
            response.name = info.VERSION_CODENAME.toLowerCase()
        }
    }
    return response
}


// -------------------------------------------------------------------
// EoF
// -------------------------------------------------------------------