/*
    The license for this source code is held by "Emma Kuo".
    I made some modifications to realize the function. Thank you.
    Click here for information on "await-semaphore".
    https://github.com/notenoughneon/await-semaphore
*/
"use strict";
class Semaphore {
    constructor(count, maxSemCount = -1) {
        this.tasks = [];
        this.count = count;
        this.maxSemCount = maxSemCount;
    }
    sched() {
        if (this.count > 0 && this.tasks.length > 0) {
            this.count--;
            let next = this.tasks.shift();
            if (next === undefined) {
                throw "Unexpected undefined value in tasks list";
            }
            next();
        }
    }
    acquire() {
        return new Promise((res, rej) => {
            var task = () => {
                var released = false;
                res(() => {
                    if (!released) {
                        released = true;
                        this.count++;
                        this.sched();
                    }
                });
            };

            if (0 < this.maxSemCount && this.maxSemCount < this.tasks.length + 1) {
                rej(new Error(`Exceeded max sem tasks.${this.tasks.length}`));
            }else{
                this.tasks.push(task);
                if (process && process.nextTick) {
                    process.nextTick(this.sched.bind(this));
                }
                else {
                    setImmediate(this.sched.bind(this));
                }
            }
        });
    }
    use(f) {
        return this.acquire()
            .then(release => {
            return f()
                .then((res) => {
                release();
                return res;
            })
                .catch((err) => {
                release();
                throw err;
            });
        });
    }
}

export default Semaphore;

