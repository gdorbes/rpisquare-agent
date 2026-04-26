// -------------------------------------------------------------------
// RPi² AGENT - API client
// -------------------------------------------------------------------
import {log} from "./log.mjs"
/** ------------------------------------------------------------------
 * @method api
 * @description JSON post to API server
 * @param {String} server
 * @param {String} path
 * @param {Object} params
 * @return {Object} JSON object
 */
export const api = async (server, path, params = {}) => {
    const url = server + path
    log("post req:", url, params)
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Accept": "application/json, text/plain, */*",
                "Content-Type": "application/json",
                "Access-Control-Origin": "*"
            },
            mode: "cors",
            body: JSON.stringify(params)
        })
        const json = await response.json()
        log("post res:", url, json)
        return json
    } catch (err) {
        const netErr = {
            code: 100,
            msg: "network error",
            data: err
        }
        log("post res:", url, netErr)
        return netErr
    }
}


// -------------------------------------------------------------------
// EoF
// -------------------------------------------------------------------