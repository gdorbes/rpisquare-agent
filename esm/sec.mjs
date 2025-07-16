// ---------------------------------------------------------------------
// RPi² CRYPTO LIB v2 (agent)
// ---------------------------------------------------------------------
import {log} from "./dev.mjs"

// ---------------------------------------------------------------------
// CONSTANTS AND VARIABLES
// ---------------------------------------------------------------------
const subtle = crypto.subtle

// ---------------------------------------------------------------------
// UTILITIES
/** --------------------------------------------------------------------
 * @function str2ab
 * @description Base64 string to buffer
 * @param {string} str
 * @return {buffer}
 */
const str2ab = str => {
    const buf = new ArrayBuffer(str.length)
    const bufView = new Uint8Array(buf)
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i)
    }
    return buf
}

/** --------------------------------------------------------------------
 * @function bufferToHex
 * @description Convert buffer to hex string
 * @param {Buffer} buffer
 * @return {String}
 */
export const bufferToHex = buffer => {
    let byteArray = new Uint8Array(buffer)
    return Array.from(byteArray, function (byte) {
        return ("0" + (byte & 0xFF).toString(16)).slice(-2);
    }).join("")
}

/** --------------------------------------------------------------------
 * @function hexToBuffer
 * @description Convert hex string
 * @param {String} str
 * @return {Buffer}
 */
export const hexToBuffer = str => {
    let a = []
    for (let i = 0, len = str.length; i < len; i += 2) {
        a.push(parseInt(str.substring(i, i + 2), 16))
    }
    return new Uint8Array(a).buffer
}

/** --------------------------------------------------------------------
 * @function bufferToPEM
 * @description format SPKI or PKCS8 key buffer to PEM
 * @param {Object} buffer - JSON Web Key
 * @param {String} type - either "PUBLIC" or "PRIVATE"
 * @return {String}
 */
export const bufferToPEM = (buffer, type) => {

    let binary = ""
    let bytes = new Uint8Array(buffer)
    let len = bytes.byteLength
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    let str = btoa(binary)
    let res = "-----BEGIN " + type + " KEY-----\n";
    while (str.length > 0) {
        res += str.substring(0, 64) + "\n"
        str = str.substring(64);
    }
    return res + "-----END " + type + " KEY-----"
}

/** --------------------------------------------------------------------
 * @function strToHex
 * @description Convert string to hex
 * @param {String} str
 * @return {String}
 */

export const strToHex = str => {
    let hex, i
    let result = ""
    for (i = 0; i < str.length; i++) {
        hex = str.charCodeAt(i).toString(16)
        result += ("000" + hex).slice(-4)
    }
    return result
}

/** --------------------------------------------------------------------
 * @function hexToStr
 * @description Convert hex to str
 * @param {String} hex
 * @return {String}
 */

export const hexToStr = hex => {
    let j
    let hexes = hex.match(/.{1,4}/g) || []
    let back = ""
    for (j = 0; j < hexes.length; j++) {
        back += String.fromCharCode(parseInt(hexes[j], 16))
    }
    return back
}


/** ------------------------------------------------------------------
 * @function digest
 * @description Compute digest from data string
 * @param {String} str - data to digest
 * @param {String} algo - Digest algorithm - SHA-256 (default), SHA-384, SHA-512
 * @return {Buffer} digest
 */
export const digest = async (str, algo = "SHA-256") => {
    const buf = await subtle.digest(algo, new TextEncoder().encode(str))
    return bufferToHex(buf)
}

// ---------------------------------------------------------------------
// CRYPTO AES
/** --------------------------------------------------------------------
 * @function aesKeyGen
 * @description Generate AES-CGM key
 * @return {Promise}
 */
export const aesKeyGen = async () => {
    return await subtle.generateKey(
        // Algorithm
        {
            name: "AES-GCM",
            length: 256
        },
        // Extractable
        true,
        // Key usages
        ["encrypt", "decrypt"])
}

/** --------------------------------------------------------------------
 * @function aesKeyExport
 * @description Export AES-CGM key as JWK object or RAW Hex string
 * @param {String} format - raw or jwk
 * @param {Object} key - AES key
 * @return {Promise}
 */
export const aesKeyExport = async (format, key) => {

    const allowed = ["jwk", "raw"]
    if (!allowed.includes(format))
        format = allowed[0]

    let exported = await subtle.exportKey(format, key)
    format === "raw" ? exported = bufferToHex(exported) : false
    return exported
}

/** --------------------------------------------------------------------
 * @function aesKeyImport
 * @description Import AES-CGM key from JWK object or RAW Hex string
 * @param {String} format - raw or jwk
 * @param {Unknown} data - exported data: could be string or object
 * @return {Promise}
 */
export const aesKeyImport = async (format, data) => {

    const allowed = ["jwk", "raw"]
    if (!allowed.includes(format))
        format = allowed[0]

    // Check data type, convert if required and import
    if ((format === "raw" && typeof data !== "string") || (format === "jwk" && typeof data !== "object")) {
        log("aes wrong import format!")
        return false
    }
    const toImport = format === "jwk" ? data : hexToBuffer(data)
    return await subtle.importKey(
        format,
        toImport,
        "AES-GCM",
        true,
        ["encrypt", "decrypt"]
    )
}

/** --------------------------------------------------------------------
 * @function aesEncrypt
 * @description AES-CGM encryption => hex string: hex-24 iv + hex encrypted
 * @param {String} str
 * @param {Object} key - AES-CGM key
 * @return {Promise}
 */
export const aesEncrypt = async (str, key) => {

    const encoded = new TextEncoder().encode(str)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await subtle.encrypt(
        {name: "AES-GCM", iv: iv},
        key,
        encoded
    )
    const strIv = bufferToHex(iv)
    const strEncrypted = bufferToHex(encryptedBuffer)
    return strIv + strEncrypted
}
/** --------------------------------------------------------------------
 * @function aesDecrypt
 * @description AES-CGM decryption(hex string: hex-24 iv + hex encrypted)
 * @param {String} hexStr
 * @param {Object} key - AES-CGM key
 * @return {Promise}
 */
export const aesDecrypt = async (hexStr, key) => {

    const iv = hexToBuffer(hexStr.substring(0, 24))
    const encrypted = hexToBuffer(hexStr.substring((24)))
    const decryptedBuffer = await subtle.decrypt(
        {name: "AES-GCM", iv: iv},
        key,
        encrypted
    )
    return new TextDecoder().decode(decryptedBuffer)
}

// ---------------------------------------------------------------------
// CRYPTO RSA
/** --------------------------------------------------------------------
 * @function rsaKeyGen
 * @description Generate extractable RSA-OAEP keys (privateKey, publicKey)
 * @return {Promise}
 */
export const rsaKeyGen = async () => {
    return await subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: {name: "SHA-256"}
        },
        // Extractable
        true,
        // Key usages
        ["encrypt", "decrypt"])
}

/** --------------------------------------------------------------------
 * @function rsaToPKCS8
 * @description RSA private key to PKCS8 Hex format or in PEM container.
 * @param {Object} rsaKey
 * @param {Boolean} pem
 * @return {Promise}
 */
export const rsaToPKCS8 = async (rsaKey, pem) => {
    const buffer = await subtle.exportKey("pkcs8", rsaKey.privateKey)
    if (pem)
        return bufferToPEM(buffer, "PRIVATE")
    else
        return bufferToHex(buffer)
}

/** --------------------------------------------------------------------
 * @function rsaToSPKI
 * @description RSA public key to SPKI either in hex string or PEM container
 * @param {Object} key
 * @param {Boolean} pem
 * @return {Promise}
 */
export const rsaToSPKI = async (key, pem) => {
    const buffer = await subtle.exportKey("spki", key.publicKey)
    if (pem)
        return bufferToPEM(buffer, "PUBLIC")
    else
        return bufferToHex(buffer)
}

/** --------------------------------------------------------------------
 * @function rsaHexKeypair
 * @description Return object private/public with hex RSA key pair
 * @return {Promise}
 */
export const rsaHexKeypair = async () => {
    const rsaKeys = await rsaKeyGen()
    return {
        private: await rsaToPKCS8(rsaKeys, false),
        public: await rsaToSPKI(rsaKeys, false)
    }
}

/** --------------------------------------------------------------------
 * @function rsaKeyImport
 * @description Import RSA private or public key
 * @param {String} format - pkcs8 (private or spki (public)
 * @param {Boolean} pem - PEM mode
 * @param {String} data - exported data
 * @param {Boolean} debug
 * @return {Promise}
 */
export const rsaKeyImport = async (format, pem, data, debug = false) => {

    // Check supported format
    const allowed = ["pkcs8", "spki"]
    if (!allowed.includes(format)) {
        format = allowed[0]
    }


    // Decode input according to PEM format or not
    let toImport
    if (pem) {
        const pemHeader = format === "pkcs8" ? "-----BEGIN PRIVATE KEY-----" : "-----BEGIN PUBLIC KEY-----"
        const pemFooter = format === "pkcs8" ? "-----END PRIVATE KEY-----" : "-----END PUBLIC KEY-----"
        const pemContents = data.substring(pemHeader.length, data.length - pemFooter.length);
        // base64 decode the string to get the binary data
        const binaryDerString = atob(pemContents);
        // convert from a binary string to an ArrayBuffer
        toImport = str2ab(binaryDerString);
    } else {
        toImport = hexToBuffer(data)
    }
    // Key Import
    const imported = await subtle.importKey(
        format,
        toImport,
        {
            name: format === "pkcs8" ? "RSA-PSS" : "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        format === "pkcs8" ? ["sign"] : ["encrypt"]
    )
    if (debug)
        log((format === "pkcs8" ? "rsa private key imported as " : "rsa public key imported as") + (pem ? "PEM content:" : "Hex string:"), imported)
    return imported
}

/** --------------------------------------------------------------------
 * @function rsaEncrypt
 * @description Encrypt string with RSA public key and return a string
 * @param {String} str - should be smaller than char-180
 * @param {Object} publicKey
 * @return {Promise}
 */
export const rsaEncrypt = async (str, publicKey) => {
    str.length > 180 ? log("⚠️ string too long for rsa encryption (char-180 max):", len, str) : false
    return bufferToHex(await subtle.encrypt(
        {
            name: "RSA-OAEP",
        },
        publicKey,
        new TextEncoder().encode(str = str.substring(0, 180))
    ))
}

/** --------------------------------------------------------------------
 * @function rsaDecrypt
 * @description Decrypt hex string with RSA private key and return a string
 * @param {String} hexStr
 * @param {Object} privateKey
 * @return {Promise}
 */
export const rsaDecrypt = async (hexStr, privateKey) => {
    return new TextDecoder().decode(await subtle.decrypt(
        {name: "RSA-OAEP"},
        privateKey,
        hexToBuffer(hexStr)
    ))
}

// ---------------------------------------------------------------------
// CRYPTO ECDSA
/** --------------------------------------------------------------------
 * @function ecdsaKeyGen
 * @description Generate Elliptic Curve key pair
 * @return {Promise}
 */
export const ecdsaKeyGen = async () => {
    return await subtle.generateKey(
        {
            name: "ECDSA",
            namedCurve: "P-256"
        },
        true,
        ["sign", "verify"]
    )
}

/** --------------------------------------------------------------------
 * @function ecdsaSign
 * @description Sign a string with private key using ECDSA
 * @param {String} str
 * @param {Object} privateKey
 * @return {Promise}
 */
export const ecdsaSign = async (str, privateKey) => {
    return bufferToHex(await subtle.sign(
        {
            name: "ECDSA",
            hash: {name: "SHA-256"},
        },
        privateKey,
        new TextEncoder().encode(str)
    ))
}

/** --------------------------------------------------------------------
 * @function ecdsaVerify
 * @description Verify signature of a string using ECDSA public key
 * @param {String} msgStr
 * @param {String} signHex
 * @param {Object} publicKey
 * @return {Promise}
 */
export const ecdsaVerify = async (msgStr, signHex, publicKey) => {
    return bufferToHex(await subtle.verify(
        {
            name: "ECDSA",
            hash: {name: "SHA-256"},
        },
        publicKey,
        hexToBuffer(signHex),
        new TextEncoder().encode(msgStr)
    )) === "00"
}
/** --------------------------------------------------------------------
 * @function ecdsaJwkKeypair
 * @description Return object private/public with hex ECDSA key pair
 * @return {Promise}
 */
export const ecdsaJwkKeypair = async () => {
    const ecdsaKeys = await ecdsaKeyGen()
    return {
        private: await subtle.exportKey("jwk", ecdsaKeys.privateKey),
        public: await subtle.exportKey("jwk", ecdsaKeys.publicKey)
    }
}

/** --------------------------------------------------------------------
 * @function ecdsaImportPrivateKey
 * @description Import JWK object of ECDSA private key
 * @return {Promise}
 */
export const ecdsaImportPrivateKey = async jwk => {
    return subtle.importKey(
        "jwk",
        jwk,
        {
            name: "ECDSA",
            namedCurve: "P-256",
        },
        true,
        ["sign"]
    )
}

/** --------------------------------------------------------------------
 * @function ecdsaImportPublicKey
 * @description Import JWK object of ECDSA private key
 * @return {Promise}
 */
export const ecdsaImportPublicKey = async jwk => {
    return subtle.importKey(
        "jwk",
        jwk,
        {
            name: "ECDSA",
            namedCurve: "P-256",
        },
        true,
        ["verify"]
    )
}

// ---------------------------------------------------------------------
// CRYPTO SECRET EXCHANGE FROM SENDER TO RECEIVER, AES-256, RSA, ECDSA
// --------------------------------------------------------------------
// FOR EACH DATA SHARING
// ---------------------------------------------------------------------
//   - A new AES key is generated to be used only once
//   - Data (str) is signed with sender ECDSA private key
//   - Hex-192 signature and data are merged then encrypted with AES key
//   - AES key is exported as hex-64 raw format
//   - AES key string is encrypted with receiver RSA public key
//   - Resulting pack to send:
//       - AES encrypted signature + data
//       - RSA encrypted AES key
//   - Receiver decrypt RSA encrypted AES key with his private RSA key and import it
//   - Encrypted data is decrypted with AES key and signature and data are split
//   - Signature is verified with sender ECDSA public key
/** --------------------------------------------------------------------
 * @function pack
 * @description Prepare encrypted secret package ready to send
 * @param {String} data
 * @param {Object} senderPrivateKeyECDSA
 * @param {Object} receiverPublicKeyRSA
 * @return {Promise}
 */
export const pack = async (data, senderPrivateKeyECDSA, receiverPublicKeyRSA) => {
    const aesKey = await aesKeyGen()
    const signature = await ecdsaSign(data, senderPrivateKeyECDSA)
    const encryptedData = await aesEncrypt(signature + data, aesKey)
    const aesKeyHex = await aesKeyExport("raw", aesKey)
    const encryptedKey = await rsaEncrypt(aesKeyHex, receiverPublicKeyRSA)
    return {
        key: encryptedKey,
        data: encryptedData
    }
}

/** --------------------------------------------------------------------
 * @function unpack
 * @description Decrypt packed secret and check signature
 * @param {String} encryptedKey
 * @param {String} encryptedData
 * @param {Object} receiverPrivateKeyRSA
 * @param {Object} senderPublicKeyECDSA
 * @return {Promise}
 */
export const unpack = async (encryptedKey, encryptedData, receiverPrivateKeyRSA, senderPublicKeyECDSA) => {
    const aesKeyHex = await rsaDecrypt(encryptedKey, receiverPrivateKeyRSA)
    const aesKey = await aesKeyImport("raw", aesKeyHex)
    const packData = await aesDecrypt(encryptedData, aesKey)
    const signature = packData.substring(0, 192)
    const data = packData.substring(192)
    return {
        data: data,
        verified: await ecdsaVerify(data, signature, senderPublicKeyECDSA)
    }
}

// ---------------------------------------------------------------------
// TEST
/** --------------------------------------------------------------------
 * @function crypTest
 * @description Test crypto lib
 * @return {Promise}
 */
export const crypTest = async () => {
    const hex = "ABCDEF12345678"
    const secret = "My great Secret"
    const buf = hexToBuffer(hex)
    log("hex", bufferToHex(buf))
    log("digest:", bufferToHex(await digest(secret)))

    const aesKey = await aesKeyGen()
    const aesJwk = await aesKeyExport("jwk", aesKey)
    const aesRaw = await aesKeyExport("raw", aesKey)
    await aesKeyImport("jwk", aesJwk)
    await aesKeyImport("raw", aesRaw)

    const aesEncrypted = await aesEncrypt(secret, aesKey)
    log("aes encrypted:", aesEncrypted)
    const aesDecrypted = await aesDecrypt(aesEncrypted, aesKey)
    log("aes decrypted:", aesDecrypted)

    const rsaKeys = await rsaKeyGen()
    const pkcs8Pem = await rsaToPKCS8(rsaKeys, true)
    const pkcs8Hex = await rsaToPKCS8(rsaKeys, false)
    const spkiPem = await rsaToSPKI(rsaKeys, true)
    const spkiHex = await rsaToSPKI(rsaKeys, false)
    await rsaKeyImport("pkcs8", true, pkcs8Pem)
    await rsaKeyImport("pkcs8", false, pkcs8Hex)
    await rsaKeyImport("spki", true, spkiPem)
    await rsaKeyImport("spki", false, spkiHex)

    const rsaEncrypted = await rsaEncrypt(secret, rsaKeys.publicKey)
    log("rsa encrypted:", rsaEncrypted)
    const rsaDecrypted = await rsaDecrypt(rsaEncrypted, rsaKeys.privateKey)
    log("rsa decrypted:", rsaDecrypted)

    const ecdsaKeys = await ecdsaKeyGen()
    const ecdsaSignature = await ecdsaSign(secret, ecdsaKeys.privateKey)
    log("ecdsa signature:", ecdsaSignature)
    log("ecdsa verify:", await ecdsaVerify(secret, ecdsaSignature, ecdsaKeys.publicKey))

    const sample = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    const rsaKeyAlice = await rsaKeyGen()
    const dsaKeyAlice = await ecdsaKeyGen()
    const rsaKeyBob = await rsaKeyGen()

    const packed = await pack(sample, dsaKeyAlice.privateKey, rsaKeyBob.publicKey)
    log("packed:", packed)
    log("unpacked:", await unpack(packed.key, packed.data, rsaKeyBob.privateKey, dsaKeyAlice.publicKey))
}

// ---------------------------------------------------------------------
// EOF
// ---------------------------------------------------------------------