/* 
    The license for this source code is held by "Emma Kuo".
    I made some modifications to realize the function. Thank you. 
    Click here for information on "await-semaphore".
    https://github.com/notenoughneon/await-semaphore
*/

export class Semaphore {
    private tasks: (() => void)[] = [];
    count: number;
    maxSemCount: number;

    constructor(count: number, maxSemCount: number = -1) {
        this.count = count;
        this.maxSemCount = maxSemCount;
    }

    private sched() {
        if (this.count > 0 && this.tasks.length > 0) {
            this.count--;
            let next = this.tasks.shift();
            if (next === undefined) {
                throw "Unexpected undefined value in tasks list";
            }

            next();
        }
    }

    public acquire() {
        return new Promise<() => void>((res, rej) => {
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

            if (0 > this.maxSemCount || this.maxSemCount >= this.tasks.length){
                this.tasks.push(task);
                if (process && process.nextTick) {
                    process.nextTick(this.sched.bind(this));
                } else {
                    setImmediate(this.sched.bind(this));
                }
            }else{
                rej();
            }
        });
    }

    public use<T>(f: () => Promise<T>) {
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

