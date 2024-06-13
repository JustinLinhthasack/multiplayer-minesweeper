// Script with all my utils, will refactor later.
const { Buffer } = require('node:buffer');

function getPayloadLengthBytes(number) {
    if (number <= 125) {
        return 0; // Uses the initial headerSize length
    } else if (number <= 32,767) {
        return 2; // Needs 16 extra bits.
    } else if (number <= 2,147,483,647) {
        return 6; // Needs 64 extra bits.
    }
}

function socketSendJSON(jsonMessage) {
    const payload = JSON.stringify(jsonMessage);
    const payload_length = payload.length;
    const payload_length_bytes = getPayloadLengthBytes(payload_length);

    const headerSize = 2; // FIN RSV 1,2,3 OPCODE MASK BASE_LENGTH
    const buffer = Buffer.alloc(headerSize + payload_length_bytes + payload_length);
    buffer.fill(129, 0, 1); // 1 0 0 0 (0 0 0 1) opcode 
    if (payload_length_bytes === 0) {
        buffer.fill(payload_length, 1, headerSize); 
    } else if (payload_length_bytes === 2) {
        buffer.fill(126, 1, headerSize); 
        buffer.writeUInt16BE(payload_length, headerSize, headerSize + payload_length_bytes);
    } else if (payload_length_bytes === 6) {
        buffer.fill(127, 1, headerSize); 
        buffer.writeBigUInt64BE(payload_length, headerSize, headerSize + payload_length_bytes);
    }
    
    if (payload_length_bytes === 0) { // everything else is the payload.
        buffer.fill(payload, headerSize); 
    } else {
        buffer.fill(payload, headerSize + payload_length_bytes);
    }
   
    return buffer;
}

function socketParseJSON(buffer) { // For now we'll assume all incoming messages have a FIN bit of 1 and is a string for simplicity
    const header = buffer[0]; //FIN RSV 1,2,3 OPCODE (should be 129)
    const maskLength = buffer[1]; // MASK PAYLOAD LENGTH

    if (header != 129) {
        return; // Incase client sends something not expected
    }

    if (maskLength >> 7 == 0) { // Mask is 0, which is bad, client needs to always send a masked message
        return;
    }

    const maskingKey = buffer.subarray(2,6);
    const payload = buffer.subarray(6);
    const parsedPayload =  Buffer.alloc(payload.length);

    for (i = 0; i < payload.length; i++) {
        parsedPayload[i] = maskingKey[i%4] ^ payload[i]; // For every byte the payload has, it unmasks in order of masking key. 1st byte goes with the 1st mask key byte, and so on loops every 5th byte. (4 % 4 == 0)
    }
    
    try {
        const parsedJSON = JSON.parse(parsedPayload.toString());
        return parsedJSON;
    } catch(err) {
        console.log("Was not valid JSON data.");
        return;
    }
    
   
}

module.exports = {socketSendJSON, socketParseJSON};