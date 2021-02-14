/* 
    The license for this source code is held by "Emma Kuo".
    I made some modifications to realize the function. Thank you. 
    Click here for information on "await-semaphore".
    https://github.com/notenoughneon/await-semaphore
*/

import { Semaphore } from "./semaphore"

export class Mutex extends Semaphore {
    constructor() {
        super(1, -1);
    }
}
