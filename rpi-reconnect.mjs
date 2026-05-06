// -------------------------------------------------------------------
// RPi² AGENT LAUNCHER WITH FORCED ROOM
// PLEASE NOTE: Raspberry Pi device must be already registered with
//              the room ID you enter. If not, agent will stop.
// -------------------------------------------------------------------
import {rpisquareAgent} from "./esm/rpa.mjs"
import * as readline from "readline/promises"

// Enter room ID
let room
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})
room = await rl.question("Enter a 32-character hex room ID or leave empty: ")
room = room.trim()
rl.close()

// Test room syntax
if (!(room === "" || /^[0-9a-fA-F]{32}$/.test(room))) {
    console.error("Invalid input: must be empty or exactly 32 hex characters.")
    process.exit(1)
}

rpisquareAgent({room: room})
// -------------------------------------------------------------------
// EoF
// -------------------------------------------------------------------