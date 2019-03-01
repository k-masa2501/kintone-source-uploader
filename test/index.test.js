(function () {

    const { run } = require("../dist/index.js");
    const sinon = require('sinon');
    const path = require('path');
    const chai = require('chai');

    function sleep(time) {
        'use strict';
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, time);
        });
    }


    describe('upload customize source code.', function () {
        'use strict';

        this.timeout(30000);
        var username = process.env.KINTONE_USERNAME;
        var password = process.env.KINTONE_PASSWORD;
        var domain = process.env.KINTONE_DOMAIN;
        var proxy = process.env.HTTP_PROXY;
        var watch = false;
        var waitingDialogMs = 5000;
        var lang = "ja";
        var customSrc = null;
        var portalSrc = null;

        before(function () { });

        beforeEach(function () { });

        it('upload plugin.', async function () {
            sinon.stub(process, 'exit');
            run(
                {
                    username,
                    password,
                    domain,
                    proxy,
                    watch,
                    waitingDialogMs,
                    lang,
                    customSrc,
                    portalSrc,
                },
                "test/test_data/jsEdit_plugin_v4.1.zip",
                function(){console.log("show help!!");}
            );
            await sleep(25000);
            process.exit.restore();
        });

        it('upload customize source code.', async function () {
            sinon.stub(process, 'exit');
            customSrc = "test/test_data/custom.manifest.success.json";
            run(
                {
                    username,
                    password,
                    domain,
                    proxy,
                    watch,
                    waitingDialogMs,
                    lang,
                    customSrc,
                    portalSrc,
                },
                null,
                function () { console.log("show help!!"); }
            );
            customSrc = null;
            await sleep(25000);
            process.exit.restore();
        });

        it('upload portal source code.', async function () {
            sinon.stub(process, 'exit');
            portalSrc = "test/test_data/portal.manifest.success.json";
            run(
                {
                    username,
                    password,
                    domain,
                    proxy,
                    watch,
                    waitingDialogMs,
                    lang,
                    customSrc,
                    portalSrc,
                },
                null,
                function () { console.log("show help!!"); }
            );
            portalSrc = null;
            await sleep(25000);
            process.exit.restore();
        });

        it('show help.', async function () {
            sinon.stub(process, 'exit');
            run(
                {
                    username,
                    password,
                    domain,
                    proxy,
                    watch,
                    waitingDialogMs,
                    lang,
                    customSrc,
                    portalSrc,
                },
                null,
                function () { console.log("show help!!"); }
            );
            await sleep(5000);
            process.exit.restore();
        });

        afterEach(function () { });

        after(async function () { });

    });

})();
