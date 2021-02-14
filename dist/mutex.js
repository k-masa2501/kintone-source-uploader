/*
    The license for this source code is held by "Emma Kuo".
    I made some modifications to realize the function. Thank you.
    Click here for information on "await-semaphore".
    https://github.com/notenoughneon/await-semaphore
*/
"use strict";
const semaphore_1 = require("./semaphore");
class Mutex extends semaphore_1.Semaphore {
    constructor() {
        super(1, -1);
    }
}
exports.Mutex = Mutex;
