

// Script with all my utils, will refactor later.
const { Buffer } = require('node:buffer')

function socketSendString(str) {
    let initialBytes = 2; // FIN RSV 1,2,3 OPCODE MASK LENGTH
    let payload = str;
    
    const buff = Buffer.alloc(initialBytes + payload.length);
    buff.fill(129, 0,1) // 1 0 0 0 (0 0 0 1) opcode 
    buff.fill(payload.length, 1,2) // since mask will always be 0, we can ignore that first bit.. hopefully... might have to add a payload size check
    buff.fill(payload, 2); // everything else is the payload.

    return buff;
}

module.exports = {socketSendString}