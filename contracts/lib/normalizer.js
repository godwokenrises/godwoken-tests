"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NormalizeL2Transaction = exports.NormalizeRawL2Transaction = void 0;
const toolkit_1 = require("@ckb-lumos/toolkit");
// Taken for now from https://github.com/xxuejie/ckb-js-toolkit/blob/68f5ff709f78eb188ee116b2887a362123b016cc/src/normalizers.js#L17-L69,
// later we can think about exposing those functions directly.
function normalizeHexNumber(length) {
    return function (debugPath, value) {
        if (!(value instanceof ArrayBuffer)) {
            let intValue = BigInt(value).toString(16);
            if (intValue.length % 2 !== 0) {
                intValue = "0" + intValue;
            }
            if (intValue.length / 2 > length) {
                throw new Error(`${debugPath} is ${intValue.length / 2} bytes long, expected length is ${length}!`);
            }
            const view = new DataView(new ArrayBuffer(length));
            for (let i = 0; i < intValue.length / 2; i++) {
                const start = intValue.length - (i + 1) * 2;
                view.setUint8(i, parseInt(intValue.substr(start, 2), 16));
            }
            value = view.buffer;
        }
        if (value.byteLength < length) {
            const array = new Uint8Array(length);
            array.set(new Uint8Array(value), 0);
            value = array.buffer;
        }
        return value;
    };
}
function normalizeRawData(length) {
    return function (debugPath, value) {
        value = new toolkit_1.Reader(value).toArrayBuffer();
        if (length > 0 && value.byteLength !== length) {
            throw new Error(`${debugPath} has invalid length ${value.byteLength}, required: ${length}`);
        }
        return value;
    };
}
function normalizeObject(debugPath, obj, keys) {
    const result = {};
    for (const [key, f] of Object.entries(keys)) {
        const value = obj[key];
        if (!value) {
            throw new Error(`${debugPath} is missing ${key}!`);
        }
        result[key] = f(`${debugPath}.${key}`, value);
    }
    return result;
}
function toNormalize(normalize) {
    return function (debugPath, value) {
        return normalize(value, {
            debugPath,
        });
    };
}
function NormalizeRawL2Transaction(rawL2Transaction, { debugPath = "raw_l2_transaction" } = {}) {
    return normalizeObject(debugPath, rawL2Transaction, {
        chain_id: normalizeHexNumber(8),
        from_id: normalizeHexNumber(4),
        to_id: normalizeHexNumber(4),
        nonce: normalizeHexNumber(4),
        args: normalizeRawData(-1),
    });
}
exports.NormalizeRawL2Transaction = NormalizeRawL2Transaction;
function NormalizeL2Transaction(l2Transaction, { debugPath = "l2_transaction" } = {}) {
    return normalizeObject(debugPath, l2Transaction, {
        raw: toNormalize(NormalizeRawL2Transaction),
        signature: normalizeRawData(65),
    });
}
exports.NormalizeL2Transaction = NormalizeL2Transaction;
//# sourceMappingURL=normalizers.js.map
