/*
    The license for this source code is held by "Emma Kuo".
    I made some modifications to realize the function. Thank you.
    Click here for information on "await-semaphore".
    https://github.com/notenoughneon/await-semaphore
*/
"use strict";
import Semaphore from "./semaphore";
class Mutex extends Semaphore {
    constructor() {
        super(1, -1);
    }
}

export default { Mutex };
