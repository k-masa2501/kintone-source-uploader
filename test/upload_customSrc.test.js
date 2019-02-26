(function() {

    const { srcUpload_run } = require("../dist/upload_customSrc");

    function sleep(time) {
        'use strict';
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, time);
        });
    }


    describe('upload portal source code.', function() {
        'use strict';

        this.timeout(10000);

        before(function() {});

        beforeEach(function () { });

        it('sample.', function() {
            srcUpload_run(process.env.KINDOMAIN, process.env.KINUID, process.env.KINPASS, "");
            console.log(process.env.KINDOMAIN);
            console.log(process.env.KINUID);
            console.log(process.env.KINPASS);
            console.log(process.env.KINPROXY);
        });

        afterEach(function() {});

        after(function() {});

    });

})();
