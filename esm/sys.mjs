// -------------------------------------------------------------------
// RPi² AGENT - HW INTERFACE
// -------------------------------------------------------------------
import {platform as platfunc} from "os"
import {readFileSync} from "fs"
import {execSync} from "child_process";

/** ------------------------------------------------------------------
 * @constant exeShell
 * @description Shortcut to execSync with stdio utf8
 * @param {String} cmd
 * @return {String}
 */
const exeShell = cmd => {
    return execSync(cmd, {stdio: "pipe", encoding: "utf8"})
}


/** ------------------------------------------------------------------
 * @constant platform
 * @description Return system platform e.g. darwin, linux...
 * @return {String}
 */
export const platform = platfunc()

/** ------------------------------------------------------------------
 * @constant serial
 * @description Return system serial number and store it for further call
 * @return {String}
 */
export const serial = () => {
    if (serial.value)
        return serial.value

    const def = {
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
    }
    serial.value = def[platform].flt(exeShell(def[platform].cmd)).toLowerCase()
    return serial.value
}

/** ------------------------------------------------------------------
 * @function model
 * @description Return hardware model and store if for further call
 * @return {String}
 */
export const model = () => {

    if (model.value)
        return model.value

    const def = {
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
    }
    model.value = def[platform].flt(exeShell(def[platform].cmd)).toLowerCase()
    return model.value
}

/** ------------------------------------------------------------------
 * @function iface
 * @description Return network interface and store if for further call
 * @return {String}
 */
export const iface = () => {
    if (iface.value)
        return iface.value

    const def = {
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
    iface.value = def[platform].flt(exeShell(def[platform].cmd)).toLowerCase()
    return iface.value
}

/** ------------------------------------------------------------------
 * @function hardware
 * @description Return hardware name
 * @return {String}
 */
export const hardware = () => {
    const thisModel = model()
    if (thisModel.search("raspberry") !== -1)
        return "raspberry"
    if (thisModel.search("mac") !== -1)
        return "mac"
    return "undefined"
}

/* ------------------------------------------------------------------
 * @function isRPi
 * @description Test is system is RPi
 * @return {Boolean}
 */
export const isRPi = () => {
    try {
        const cpuInfo = readFileSync("/proc/cpuinfo", "utf8");
        return /Raspberry Pi/i.test(cpuInfo)
    } catch (err) {
        return false
    }
}

/** ------------------------------------------------------------------
 * @function os
 * @description Return OS version and codename
 * @return {Object}
 */
export const os = () => {

    let returned
    let result = {
        version: "unknown",
        name: "unknown"
    }
    const hwName = hardware()
    if (hwName === "mac") {
        const latestVersions = {
            "26": "tahoe",
            "15": "sequoia",
            "14": "sonoma",
            "13": "ventura",
            "12": "monterey",
            "11": "big sur",
        }
        result.version = exeShell("sw_vers -productVersion").substring(0, 2)
        const known = latestVersions[result.version]
        known ? result.name = known : false
    }

    if (hwName === "raspberry") {
        returned = exeShell("cat /etc/os-release")
        const lines = returned.split("\n")
        const info = {}
        lines.forEach(line => {
            const [key, value] = line.split("=")
            if (key && value) {
                info[key] = value.replace(/"/g, "");
            }
        })
        result.version = info["VERSION_ID"]
        result.name = info["VERSION_CODENAME"].toLowerCase()
    }
    return result
}

// -------------------------------------------------------------------
// EoF
// -------------------------------------------------------------------