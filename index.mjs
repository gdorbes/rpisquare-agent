// -------------------------------------------------------------------
// RPi² AGENT - TOP LEVEL
// -------------------------------------------------------------------
import {readFileSync, writeFileSync} from "fs"
import {io} from "socket.io-client"
import {log} from "./esm/dev.mjs"
import {ecdsaJwkKeypair, rsaHexKeypair} from "./esm/sec.mjs";
import {model, serial, networkInterface} from "./esm/hwi.mjs"

// -------------------------------------------------------------------
// GLOBAL CONSTANTS
// -------------------------------------------------------------------
export const ROM = {
    PREFIX: "ruc-",
    API: {SERVER: "https://api.rpisquare.com"},
    SOCKET: {
        SERVER: "https://socket.rpisquare.com",
        OPTIONS: {
            secure: true,
            forceNew: true,
            transports: ["websocket"],
            pingInterval: 10000,
            pingTimeout: 10000
        }
    },
    CONFIG: "./config-rpi².json"
}

// -------------------------------------------------------------------
// GLOBAL VARIABLES
// -------------------------------------------------------------------
export let agent = {
    serial: await serial(),
    model: await model(),
    iface: await networkInterface()
}
export let config = {
    room: "", // Defined with uuid on agent registration e.g. "ns0000...1234"
    spacePubEcdsa: "none", // idem,
    spacePubRsa: "none", // idem
    ecdsa: {}, // Agent ECDSA keypair
    rsa: {} // Agent RSA keypair
}
export let socket

// -------------------------------------------------------------------
// INIT
// -------------------------------------------------------------------
const init = async () => {

    log("agent:", agent)

    // Init configuration either with either found file of default value
    try {
        config = JSON.parse(readFileSync(ROM.CONFIG))
        log(ROM.CONFIG, "successfully read")
    } catch (err) {
        try {
            log(ROM.CONFIG, "not found")
            writeFileSync(ROM.CONFIG, JSON.stringify(config, null, 2), "utf8")
            log("default config successfully written");
        } catch (err) {
            log(ROM.CONFIG, "write error:", err)
        }
    }

    // Socket connection
    socket = io(ROM.SOCKET.SERVER, {
        ...ROM.SOCKET.OPTIONS, ...{
            query: {
                serial: agent.serial
            }
        }
    })
    log("socket channel:", socket ? "ok" : "error")

    // Connection event
    socket.on("connect", () => {
        log("connected socket:", socket.id)
    })

    // Listen-to register event
    socket.on("register", async (args, callback) => {
            try {
                args = JSON.parse(args)
                log("args", args)
                config.room = args.room
                config.spacePubEcdsa = args.ecdsaPublic
                config.spacePubRsa = args.rsaPublic
                config.ecdsa = await ecdsaJwkKeypair()
                config.rsa = await rsaHexKeypair()

                writeFileSync(ROM.CONFIG, JSON.stringify(config, null, 2), "utf8")
                log("config update successful")
                callback(JSON.stringify({
                    status: "ok",
                    model: agent.model,
                    iface: agent.iface,
                    ecdsaPub: config.ecdsa.public,
                    rsaPub: config.rsa.public
                }))
            } catch (err) {
                log("config update error:", err)
                callback(JSON.stringify({status: err}))
            }
        }
    )
}
init()
// -------------------------------------------------------------------
// EoF
// -------------------------------------------------------------------