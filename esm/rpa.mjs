// -------------------------------------------------------------------
// RPi² AGENT
// -------------------------------------------------------------------
// IMPORT
// -------------------------------------------------------------------
// Node.js local modules
import {readFileSync, writeFileSync, existsSync} from "fs"
import {spawn} from "child_process"

// Modules installed with NPM
import {io} from "socket.io-client"
import {RIO} from "rpi-io"

// Project modules
import {log, warn, traceCfg} from "./log.mjs"
import {hardware, iface, model, os, serial, isRPi} from "./sys.mjs"
import {api} from "./net.mjs"
import {ctrlC, sleep} from "./ctl.mjs"

// -------------------------------------------------------------------
// CONSTANTS AND VARIABLES
// -------------------------------------------------------------------
const rpa = {} // Raspberry Pi Agent

rpa.API_SERVER = "https://api.rpisquare.com"
rpa.CONFIG_FILE = "./__cfg__.json"
rpa.SOCKET_SERVER = "https://socket.rpisquare.com"
rpa.SOCKET_OPTIONS = {
    secure: true,
    forceNew: true,
    transports: ["websocket"],
    pingInterval: 10000,
    pingTimeout: 10000
}

rpa.prop = {            // Agent properties
    hardware: hardware(),
    model: model(),
    os: os(),
    iface: iface(),
    serial: serial()
}
rpa.interrupted = false // Interruption flag
rpa.config = {}         // Local configuration (e.g. room
rpa.io = {}             // GPIO configuration
rpa.socket = {}         // Socket data
rpa.socketIsConnected = false

/** ------------------------------------------------------------------
 * @function rpa.respawn
 * @description Close all GPIOs then
 *              Spawn a fresh copy of current script and dies
 */
rpa.respawn = () => {
    RIO.closeAll()
    spawn(process.execPath, process.argv.slice(1), {
        detached: true,  // child independent of parent
        stdio: 'inherit' // inherit stdin/stdout/stderr
    }).unref() // parent exit when child start
    process.exit() // kill all process
}
/** ------------------------------------------------------------------
 * @function rpa.cfgWrite
 * @param {Object} cfg
 * @description Write JSON config to file
 * @return {Boolean}
 */
rpa.cfgWrite = cfg => {
    try {
        writeFileSync(rpa.CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf8")
        log("config written")
        return true
    } catch (err) {
        warn("Config write error: " + err)
        return false
    }
}

/** ------------------------------------------------------------------
 * @function rpa.cfgRead
 * @description Read config file and return success status
 * @return {Boolean}
 */
rpa.cfgRead = () => {
    try {
        if (!existsSync(rpa.CONFIG_FILE)) {
            log("config file not found")
            return false
        }

        rpa.config = JSON.parse(readFileSync(rpa.CONFIG_FILE))
        log("read config:", rpa.config)
        return true
    } catch (err) {
        log("config read error:", err)
        return false
    }
}

/** ------------------------------------------------------------------
 * @function rpa.rlog
 * @description Send arguments to remote console in RPi² app
 */
rpa.rlog = function () {
    const now = new Date().getTime()
    log(Array.prototype.slice.call(arguments).join(" "))
    rpa.socket.emit("console", {
        room: rpa.config.room,
        time: now,
        params: Array.from(arguments)
    })
}

/** ------------------------------------------------------------------
 * @function rpa.gpiosLoad
 * @description Async Connect to API server to load GPIO list
 *              from API and save in rpa.io
 * @return {Number}     -1: error => Network error
 *                      x > -1: GPIO list length
 */
rpa.gpiosLoad = async () => {

    const res = await api(rpa.API_SERVER, "/agent/gpio/list", {
        room: rpa.config.room,
        serial: rpa.prop.serial
    })

    // Stop on API error
    if (res.code !== 200) {
        return -1
    }

    // Stop on empty data
    if (!res.data) {
        log("GPIO definition is empty")
        return 0
    }

    rpa.io = {} // E.g. {17: {name: "toto", instance: instanceObject}
    for (const [id, cfg] of Object.entries(res.data)) {

        rpa.io[cfg.line] = {name: cfg.name}
        switch (cfg.mode) {
            case "out":
                rpa.io[cfg.line].instance = new RIO(cfg.line, "output", {value: cfg.init.value})
                break
            case "in":
                rpa.io[cfg.line].instance = new RIO(cfg.line, "input", {bias: cfg.init.bias})
                break
            case "pwm":
                rpa.io[cfg.line].instance = new RIO(cfg.line, "pwm", cfg.init)
                break
        }
        rpa.rlog("line", cfg.line, "is ready for", cfg.mode.toUpperCase(), "operations")
    }
    return Object.entries(res.data).length
}

/** ------------------------------------------------------------------
 * @function rpa.cmdFeedback
 * @description Command feedback: console, acknowledge.
 * @param {Number} code
 * @param {String} msg
 * @param {Object} data
 * @param {Function} acknowledge
 * @param {Object} args
 */
rpa.cmdFeedback = (code, msg, data, acknowledge, args) => {

    // Callback to acknowledge socket server
    acknowledge(JSON.stringify({
        code: code,
        msg: msg,
        data: data
    }))

    // If required emit message to console
    if (args.fbCon) {
        let textData = "- data"
        if (typeof data === "undefined" || data === "") {
            textData = "- no data"
            data = ""
        }
        rpa.rlog("line", args.line, "command", "'" + args.command + "' returned code", code, textData, data)
    }
}

/** --------------------------------------------------------------
 * @function rpa.execCommand
 * @description Test command arguments received by socket and exec command
 * @param {Object} args
 * @param {Function} acknowledge
 */
rpa.execCommand = (args, acknowledge) => {
    const ERR_MSG = {
        200: "OK",
        210: "Line not found",
        220: "Wrong mode",
        230: "Invalid value",
        240: "Invalid command",
        250: "System error"
    }

    log("received command:", args)

    // Flag for global commands
    let lineCommand = true
    if (["restartAgent"].indexOf(args.command) !== -1) lineCommand = false

    // 210: Line not found
    if (lineCommand && !rpa.io[args.line]) {
        rpa.cmdFeedback(210, ERR_MSG[230], "", acknowledge, args)
        return
    }

    try {
        switch (args.command) {
            case "write":
                // 220
                if (rpa.io[args.line].instance.mode !== "output") {
                    rpa.cmdFeedback(220, ERR_MSG[220], "", acknowledge, args)
                    return
                }
                // 230
                if ([0, 1].indexOf(args.params.toWrite) === -1) {
                    rpa.cmdFeedback(230, ERR_MSG[230], "", acknowledge, args)
                    return
                }
                // 200
                rpa.io[args.line].instance.write(args.params.toWrite)
                rpa.cmdFeedback(200, ERR_MSG[200], args.params.toWrite, acknowledge, args)
                return
            case "read":
                // 220
                if (rpa.io[args.line].instance.mode !== "input") {
                    rpa.cmdFeedback(220, ERR_MSG[220], "", acknowledge, args)
                    return
                }
                // 200
                const gpioValue = rpa.io[args.line].instance.read()
                rpa.cmdFeedback(200, ERR_MSG[200], gpioValue, acknowledge, args)
                return
            case "monitoringStart":
                // 220
                if (rpa.io[args.line].instance.mode !== "input") {
                    rpa.cmdFeedback(220, ERR_MSG[220], "", acknowledge, args)
                    return
                }
                // 230
                if (typeof args.params.rebounce !== "number" || args.params.rebounce < 0 || args.params.rebounce > 10000) {
                    rpa.cmdFeedback(230, ERR_MSG[230], args.params.rebounce, acknowledge, args)
                    return
                }
                // 200
                rpa.io[args.line].instance.monitoringStop()
                rpa.io[args.line].instance.monitoringStart(edge => {
                    //  On edge detection: Emit event and log to console
                    rpa.socket.emit("monitor", {
                        opId: args.opId,
                        room: rpa.config.room,
                        agent: rpa.prop.serial,
                        line: args.line,
                        edge: edge,
                        time: new Date()
                    })
                    rpa.rlog("line", args.line, "monitored event", edge)
                }, "both", args.params.rebounce)
                rpa.cmdFeedback(200, ERR_MSG[200], "", acknowledge, args)
                return
            case "monitoringStop":
                // 220
                if (rpa.io[args.line].instance.mode !== "input") {
                    rpa.cmdFeedback(220, ERR_MSG[220], "", acknowledge, args)
                    return
                }
                // 200
                rpa.io[args.line].instance.monitoringStop()
                rpa.cmdFeedback(200, ERR_MSG[200], "", acknowledge, args)
                return
            case "pwmDuty":
                // 220
                if (rpa.io[args.line].instance.mode !== "pwm") {
                    rpa.cmdFeedback(220, ERR_MSG[220], "", acknowledge, args)
                    return
                }
                // 230
                if (typeof args.params.dutyPercent !== "number" || args.params.dutyPercent < 0 || args.params.dutyPercent > 100) {
                    rpa.cmdFeedback(230, ERR_MSG[230], "", acknowledge, args)
                    return
                }
                // 200
                rpa.io[args.line].instance.pwmDuty(args.params.dutyPercent)
                rpa.cmdFeedback(200, ERR_MSG[200], args.params.dutyPercent, acknowledge, args)
                return
            case "restartAgent":
                rpa.cmdFeedback(200, ERR_MSG[200], "", acknowledge, args)
                rpa.respawn()
                return
            // 240
            default:
                // Err240: Invalid command
                rpa.cmdFeedback(240, ERR_MSG[240], "", acknowledge, args)
                return
        }
    } catch (err) {
        log("catched error in GPIO command:", err)
        RIO.closeAll()
        rpa.cmdFeedback(250, ERR_MSG[250], err, acknowledge, args)
    }
}
// -------------------------------------------------------------------
// AGENT MAIN FUNCTION
/** ------------------------------------------------------------------
 * @function rpisquareAgent
 * @description Main agent function
 * @param {Object} opt - See default options below
 * @return {Boolean}
 */
export const rpisquareAgent = async (opt) => {

    const defopt = {
        room: "",   // User communication room
        logLevel: 2, // 2: log+warning, 1: log, 0: none
        socketConnectionTimeout: 1000,
        RestartTimetout: 2000,
    }
    opt = {...defopt, ...opt}

    traceCfg(opt.logLevel)

    // Stop if not RPi
    if (!isRPi()) {
        warn("Wrong device type: Not a Raspberry Pi")
        return false
    }

    // Init variables
    log("hardware:", rpa.prop.hardware)
    log("model:", rpa.prop.model)
    log("operating system:", rpa.prop.os)
    log("network interface:", rpa.prop.iface)
    log("serial number:", rpa.prop.serial)

    // Init config with room if any and valid
    if (opt.room.length === 32) {
        rpa.config = {room: opt.room}
        rpa.cfgWrite(rpa.config)
    }


    // Run ctrl+c monitor => Close RIO instances if any
    ctrlC(() => {
        rpa.interrupted = true
        RIO.closeAll()
    })

    // Init socket and related events
    try {
        rpa.socket = io(rpa.SOCKET_SERVER, {
            ...rpa.SOCKET_OPTIONS, ...{
                query: {
                    serial: rpa.prop.serial
                }
            }
        })

        /** -----------------------------------------------------------
         * @event connect
         * @description Received when socket connection is OK
         *              Set connection flag for further network operations
         */
        // Event: Socket connection OK
        rpa.socket.on("connect", () => {
            rpa.socketIsConnected = true
            log("socket is connected:", rpa.socket.id)
        })

        /** -----------------------------------------------------------
         * @event connect_error
         * @description Received on socket connection error
         *              Wait some time then restart Node.js process
         * @param {Object} err
         */
        rpa.socket.on("connect_error", async err => {
            warn("Socket connect error:", err.message)
            await sleep(opt.RestartTimetout)
            rpa.respawn()
        })

        /** -----------------------------------------------------------
         * @event register
         * @description When user room is not forced on run,
         *              This event is received from API server when
         *              user register a device with app.rpisquare.com
         *              and a RPi serial number
         * @param {Object} args
         * @param {Function} acknowledge
         */
        if (opt.room === "") rpa.socket.on("register", async (args, acknowledge) => {
                try {
                    args = JSON.parse(args)
                    log("args", args)

                    rpa.config = {room: args.room}
                    const cfgWritten = rpa.cfgWrite(rpa.config)

                    if (cfgWritten) {
                        // Successful acknowledge to server with RPi data
                        acknowledge(JSON.stringify({
                            status: "ok",
                            model: rpa.prop.model,
                            iface: rpa.prop.iface,
                        }))

                        // Restart agent
                        rpa.respawn()
                    }
                } catch (err) {
                    warn("Config update error:", err)
                    acknowledge(JSON.stringify({status: err}))
                }
            }
        )

        /** -----------------------------------------------------------
         * @event reload
         * @description Agent update requested by API server to reload GPIO config
         */
        rpa.socket.on("reload", async () => {
            RIO.closeAll()
            rpa.rlog("agent reload")
            rpa.respawn()
        })


        /** -----------------------------------------------------------
         * @event cmd
         * @description Command received from client with acknowledge requirement
         *              See method execCommand for details
         * @param {Object} args - Command arguments
         * @param {Function} acknowledge
         */
        rpa.socket.on("cmd", (args, acknowledge) => {
            rpa.execCommand(args, acknowledge)
        })
    } catch (err) {
        RIO.closeAll()
        warn("Network error - please retry later: ", err)
        return false
    }

    try {
        // Wait for socket connection to continue
        let i = Math.round(opt.socketConnectionTimeout / 10)
        while (!rpa.socketIsConnected && i > 0) {
            await sleep(10, false)
            i--
        }
        if (i <= 0) {
            warn("Socket connection issue => retry later")
            return false
        }

        // Room forced but config file is missing
        if (opt.room.length > 0 && !rpa.cfgRead()) {
            warn("Configuration file is missing!")
            warn("Please delete file '__cfg__.json' and restart device registration from app.rpisquare.com.")
            return false
        }

        // If config found i.e. already registered => Load GPIO definition
        if (rpa.cfgRead()) {
            const loaded = await rpa.gpiosLoad()
            if (loaded === -1) {
                warn("Serial number and room id  do not match!")
                warn("Please delete file '__cfg__.json' and restart device registration from app.rpisquare.com.")
                return false
            }

            log("#line(s) initialized:", Math.max(0, await loaded))
            return true
        }
    } catch (err) {
        RIO.closeAll()
        warn("Uncatched error: ", err)
        return false
    }
}

// -------------------------------------------------------------------
// EoF
// -------------------------------------------------------------------
