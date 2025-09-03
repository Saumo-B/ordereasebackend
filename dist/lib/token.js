"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeToken = void 0;
let counter = 1;
const makeToken = () => {
    if (counter > 9999)
        counter = 1; // reset after 9999
    const token = counter.toString().padStart(4, "0");
    counter++;
    return token;
};
exports.makeToken = makeToken;
