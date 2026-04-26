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
import {log, warn, traceCfg} from "./esm/log.mjs"
import {hardware, iface, model, os, serial, isRPi} from "./esm/sys.mjs"
import {api} from "./esm/net.mjs"
import {ctrlC, sleep} from "./esm/ctl.mjs"

// -------------------------------------------------------------------
// CLASS Agent
// -------------------------------------------------------------------
class Agent {

    static API_SERVER = "https://api.rpisquare.com"
    static CONFIG_FILE = "./__cfg__.json"
    static SOCKET_SERVER = "https://socket.rpisquare.com"
    static SOCKET_OPTIONS = {
        secure: true,
        forceNew: true,
        transports: ["websocket"],
        pingInterval: 10000,
        pingTimeout: 10000
    }

    /** ---------------------------------------------------------------
     * @method contructor
     * @description To build agent instance
     * @param {Object} opt - See below
     */

    constructor(opt) {
        const defopt = {
            debug: 2, // 2: log+warning, 1: log, 0: none
            maxTimeToConnect: 1000, // Max connection time before error
            waitToRestart: 2000 // Wait time before restarting
        }
        opt = {...defopt, ...opt}

        // Stop if device is not RPi
        if (!isRPi())
            throw "Wrong device type: Not a Raspberry Pi!"

        // Set log level
        traceCfg(opt.debug)

        // Connection param
        this.maxTimeToConnect = opt.maxTimeToConnect
        this.waitToRestart = opt.waitToRestart

        // Set agent properties
        this.hardware = hardware()
        log("hardware:", this.hardware)
        this.model = model()
        log("model:", this.model)
        this.os = os()
        log("operating system:", this.os)
        this.iface = iface()
        log("network interface:", this.iface)
        this.serial = serial()
        log("serial number:", this.serial)

        // Run ctrl+c monitor => Close RIO instances if any
        ctrlC(() => {
            this.interrupted = true
            RIO.closeAll()
        })
        this.interrupted = false

        // Init agent config: room is defined on socket-based register
        this.config = {room: ""}

        // Init GPIO configuration that is set by this.gpiosLoad()
        this.io = {}


        // Init web socket and related events
        this.socketIsConnected = false
        try {
            this.socket = io(Agent.SOCKET_SERVER, {
                ...Agent.SOCKET_OPTIONS, ...{
                    query: {
                        serial: this.serial
                    }
                }
            })

            /** -----------------------------------------------------------
             * @event connect
             * @description Received when socket connection is OK
             *              Set connection flag for further network operations
             */
            // Event: Socket connection OK
            this.socket.on("connect", () => {
                this.socketIsConnected = true
                log("socket is connected:", this.socket.id)
            })

            /** -----------------------------------------------------------
             * @event connect_error
             * @description Received on socket connection error
             *              Wait some time then restart Node.js process
             * @param {Object} err
             */
            this.socket.on("connect_error", async err => {
                warn("Socket connect error:", err.message)
                await sleep(this.waitToRestart)
                this.restart()
            })

            /** -----------------------------------------------------------
             * @event register
             * @description Event received from API server when a user
             *              uses https://rpisquare.com/app to register
             *              a RPi using its serial number:
             * @param {Object} args
             * @param {Function} acknowledge
             */
            this.socket.on("register", async (args, acknowledge) => {
                    try {
                        args = JSON.parse(args)
                        log("args", args)

                        // A room is communication key between a user and his/her agents
                        // This info is saved in local config file for further communication
                        this.config = {room: args.room}
                        this.configWrite()
                        log("registration config update successful")

                        // Registration is complete => Successful acknowledge to server
                        // with RPi data: model and network interface type e.g. wlan, eth...
                        acknowledge(JSON.stringify({
                            status: "ok",
                            model: this.model,
                            iface: this.iface,
                        }))

                        // When registered, agent load GPIO definitions from server
                        log("#line(s) initialized:", Math.max(0, await this.gpiosLoad()))

                    } catch (err) {
                        warn("config update error:", err)
                        acknowledge(JSON.stringify({status: err}))
                    }
                }
            )

            /** -----------------------------------------------------------
             * @event reload
             * @description Agent update requested by API server to reload GPIO config
             */
            this.socket.on("reload", async () => {
                RIO.closeAll()
                this.rlog("agent reload")
                log("#line(s) reloaded:", Math.max(0, await this.gpiosLoad()))
            })


            /** -----------------------------------------------------------
             * @event cmd
             * @description Command received from client with acknowledge requirement
             *              See method execCommand for details
             * @param {Object} args - Command arguments
             * @param {Function} acknowledge
             */
            this.socket.on("cmd", (args, acknowledge) => {
                this.execCommand(args, acknowledge)
            })
        } catch (err) {
            throw new Error("Network error - Please retry later: " + err)
        }
    }

    /** ---------------------------------------------------------------
     * @method restart
     * @description Restart current script
     */
    restart() {

        // Close GPIO(s) to prevent IO conflict on restart
        RIO.closeAll()

        //
        if (!this.interrupted) { // Avoid restart on ctrl+c
            // Spawn new Node.js process with script arg
            spawn(process.execPath, process.argv.slice(1), {
                detached: true,  // child independent of parent
                stdio: 'inherit' // inherit stdin/stdout/stderr
            }).unref() // parent exit when child start
            process.exit() // kill all process
        }
    }

    /** --------------------------------------------------------------
     * @function configWrite
     * @description Write JSON config to file
     */
    configWrite() {
        try {
            writeFileSync(Agent.CONFIG_FILE, JSON.stringify(this.config, null, 2), "utf8")
            log("config saved")
        } catch (err) {
            throw new Error("Config write error: " + err)
        }
    }

    /** --------------------------------------------------------------
     * @method configRead
     * @description Read config file and return success status
     * @return {Boolean}
     */
    configRead = () => {
        if (!existsSync(Agent.CONFIG_FILE)) {
            warn("config file not found")
            return false
        }

        try {
            this.config = JSON.parse(readFileSync(Agent.CONFIG_FILE))
            log("read config:", this.config)
            return true
        } catch (err) {
            log("config read error:", err)
            return false
        }
    }

    /** --------------------------------------------------------------
     * @method gpiosLoad
     * @description Async Connect to API server to load GPIO list
     *              from API and save in this.gpio
     * @return {Number}     -1: error => Network error
     *                      x > -1: GPIO list length
     */
    async gpiosLoad() {

        const res = await api(Agent.API_SERVER, "/agent/gpio/list", {
            room: this.config.room,
            serial: this.serial
        })

        // Stop on API error
        if (res.code !== 200) {
            warn("error loading GPIO list:", res.code)
            return -1
        }

        // Stop on empty data
        if (!res.data) {
            log("GPIO definition is empty")
            return 0
        }

        this.io = {} // E.g. {17: {name: "toto", instance: instanceObject}
        for (const [id, cfg] of Object.entries(res.data)) {

            this.io[cfg.line] = {name: cfg.name}
            switch (cfg.mode) {
                case "out":
                    this.io[cfg.line].instance = new RIO(cfg.line, "output", {value: cfg.init.value})
                    break
                case "in":
                    this.io[cfg.line].instance = new RIO(cfg.line, "input", {bias: cfg.init.bias})
                    break
                case "pwm":
                    this.io[cfg.line].instance = new RIO(cfg.line, "pwm", cfg.init)
                    break
            }
            this.rlog("line", cfg.line, "is ready for", cfg.mode.toUpperCase(), "operations")
        }
        return Object.entries(res.data).length
    }

    /** --------------------------------------------------------------
     * @method rlog
     * @description Send arguments to remote console in RPi² app
     */
    rlog() {
        const now = new Date().getTime()
        log(Array.prototype.slice.call(arguments).join(" "))
        this.socket.emit("console", {
            room: this.config.room,
            time: now,
            params: Array.from(arguments)
        })
    }

    /** --------------------------------------------------------------
     * @method cmdFeedback
     * @description Command feedback: console, acknowledge.
     * @param {Number} code
     * @param {String} msg
     * @param {Object} data
     * @param {Function} acknowledge
     * @param {Object} args
     */
    cmdFeedback(code, msg, data, acknowledge, args) {

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
            this.rlog("line", args.line, "command", "'" + args.command + "' returned code", code, textData, data)
        }
    }

    /** --------------------------------------------------------------
     * @method execCommand
     * @description Test command arguments received by socket and exec command
     * @param {Object} args
     * @param {Function} acknowledge
     */
    execCommand(args, acknowledge) {
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
        if (lineCommand && !this.io[args.line]) {
            this.cmdFeedback(210, ERR_MSG[230], "", acknowledge, args)
            return
        }

        try {
            switch (args.command) {
                case "write":
                    // 220
                    if (this.io[args.line].instance.mode !== "output") {
                        this.cmdFeedback(220, ERR_MSG[220], "", acknowledge, args)
                        return
                    }
                    // 230
                    if ([0, 1].indexOf(args.params.toWrite) === -1) {
                        this.cmdFeedback(230, ERR_MSG[230], "", acknowledge, args)
                        return
                    }
                    // 200
                    this.io[args.line].instance.write(args.params.toWrite)
                    this.cmdFeedback(200, ERR_MSG[200], args.params.toWrite, acknowledge, args)
                    return
                case "read":
                    // 220
                    if (this.io[args.line].instance.mode !== "input") {
                        this.cmdFeedback(220, ERR_MSG[220], "", acknowledge, args)
                        return
                    }
                    // 200
                    const gpioValue = this.io[args.line].instance.read()
                    this.cmdFeedback(200, ERR_MSG[200], gpioValue, acknowledge, args)
                    return
                case "monitoringStart":
                    // 220
                    if (this.io[args.line].instance.mode !== "input") {
                        this.cmdFeedback(220, ERR_MSG[220], "", acknowledge, args)
                        return
                    }
                    // 230
                    if (typeof args.params.rebounce !== "number" || args.params.rebounce < 0 || args.params.rebounce > 10000) {
                        this.cmdFeedback(230, ERR_MSG[230], args.params.rebounce, acknowledge, args)
                        return
                    }
                    // 200
                    const self = this
                    this.io[args.line].instance.monitoringStop()
                    this.io[args.line].instance.monitoringStart(edge => {
                        //  On edge detection: Emit event and log to console
                        self.socket.emit("monitor", {
                            opId: args.opId,
                            room: self.config.room,
                            agent: self.serial,
                            line: args.line,
                            edge: edge,
                            time: new Date()
                        })
                        self.rlog("line", args.line, "monitored event", edge)
                    }, "both", args.params.rebounce)
                    this.cmdFeedback(200, ERR_MSG[200], "", acknowledge, args)
                    return
                case "monitoringStop":
                    // 220
                    if (this.io[args.line].instance.mode !== "input") {
                        this.cmdFeedback(220, ERR_MSG[220], "", acknowledge, args)
                        return
                    }
                    // 200
                    this.io[args.line].instance.monitoringStop()
                    this.cmdFeedback(200, ERR_MSG[200], "", acknowledge, args)
                    return
                case "pwmDuty":
                    // 220
                    if (this.io[args.line].instance.mode !== "pwm") {
                        this.cmdFeedback(220, ERR_MSG[220], "", acknowledge, args)
                        return
                    }
                    // 230
                    if (typeof args.params.dutyPercent !== "number" || args.params.dutyPercent < 0 || args.params.dutyPercent > 100) {
                        this.cmdFeedback(230, ERR_MSG[230], "", acknowledge, args)
                        return
                    }
                    // 200
                    this.io[args.line].instance.pwmDuty(args.params.dutyPercent)
                    this.cmdFeedback(200, ERR_MSG[200], args.params.dutyPercent, acknowledge, args)
                    return
                case "restartAgent":
                    this.cmdFeedback(200, ERR_MSG[200], "", acknowledge, args)
                    this.restart()
                    return
                // 240
                default:
                    // Err240: Invalid command
                    this.cmdFeedback(240, ERR_MSG[240], "", acknowledge, args)
                    return
            }
        } catch (err) {
            log("catched error in GPIO command:", err)
            RIO.closeAll()
            this.cmdFeedback(250, ERR_MSG[250], err, acknowledge, args)
        }
    }
}

// -------------------------------------------------------------------
// AGENT LAUNCH
//  1. Define Agent instance with default options
//  2. Wait for socket connection to continue
//  3. Load GPIO(s) definition from and init them
// -------------------------------------------------------------------
(async () => {

    // Define Agent instance with default options
    const agent = new Agent()

    // Wait for socket connection to continue
    let i = Math.round(agent.maxTimeToConnect / 10)
    while (!agent.socketIsConnected && i > 0) {
        await sleep(10, false)
        i--
    }
    if (i <= 0) {
        warn("socket connection issue => retry later")
        return false
    }

    // If config is available => Load and init GPIOS
    if (agent.configRead()) {
        log("#line(s) initialized:", Math.max(0, await agent.gpiosLoad()))
    } else {
        warn("no config found")
    }
})()


// -------------------------------------------------------------------
// EoF
// -------------------------------------------------------------------
