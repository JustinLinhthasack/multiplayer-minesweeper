

// Script with all my utils, will refactor later.
const { Buffer } = require('node:buffer')

function socketSendString(str) {
    let initialBytes = 2; // FIN RSV 1,2,3 OPCODE MASK LENGTH
    let payload = str;
    
    const buff = Buffer.alloc(initialBytes + payload.length);
    buff.fill(129, 0,1) // 1 0 0 0 (0 0 0 1) opcode 
    buff.fill(payload.length, 1,2) // since mask will always be 0, we can ignore that first bit.. hopefully... might have to add a payload size check
    buff.fill(payload, 2); // everything else is the payload.

    console.log(buff)

    return buff;
}

function socketParseString(buffer) { // For now we'll assume all incoming messages have a FIN bit of 1 and is a string for simplicity
    const header = buffer[0]; //FIN RSV 1,2,3 OPCODE (should be 129)
    const maskLength = buffer[1]; // MASK PAYLOAD LENGTH

    if (header != 129) {
        return "UNKNOWN DATA"; // Incase client sends something not expected
    } 

    if (maskLength >> 7 == 0) { // Mask is 0, which is bad, client needs to always send a masked message
        return "INVALID MASK"
    }

    const maskingKey = buffer.subarray(2,6);
    const payload = buffer.subarray(6);
    const parsedPayload =  Buffer.alloc(payload.length);

    for (i = 0; i < payload.length; i++) {
        parsedPayload[i] = maskingKey[i%4] ^ payload[i] ;
    }
    
    return parsedPayload.toString();
}

module.exports = {socketSendString, socketParseString}