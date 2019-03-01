(function () {

    const { run } = require("../dist/index.js");
    const { srcUpload_run } = require("../dist/upload_customSrc");
    const { pluginUpload_run } = require("../dist/upload_plugin.js");
    const { portalUpload_run } = require("../dist/upload_portalSrc.js");
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


    describe('index test.', function () {
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

        beforeEach(function () { 
            sinon.stub(process, 'exit');
        });

        it('upload plugin.', async function () {

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
        });

        it('upload customize source code.', async function () {

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
        });

        it('upload portal source code.', async function () {

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
        });

        it('show help.', async function () {

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
        });

        afterEach(function () {
            process.exit.restore();
        });

        after(async function () {});

    });

    describe('upload customize source code test.', function () {
        'use strict';

        this.timeout(30000);
        var instance = null;

        before(function () { });

        beforeEach(function () {
            sinon.stub(process, 'exit');
        });

        it('upload success.', async function () {

            instance = srcUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/custom.manifest.success.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );

            const mutex = instance.getMutex();
            mutex.release = await mutex.obj.acquire();
            mutex.release();
        });

        it('upload wait 3 second.', async function () {
            instance = srcUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/custom.manifest.success.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );
            const mutex = instance.getMutex();
            mutex.release = await mutex.obj.acquire();
            mutex.release();
        });

        it('checkIfNeedToUpload match manifest file.', async function () {
            const result = instance.checkIfNeedToUpload("custom.manifest.success.json");
            chai.assert.equal(result, true);
        });

        it('checkIfNeedToUpload match desktop js.', async function () {
            const result = instance.checkIfNeedToUpload("js/desktop/desktop1.js");
            chai.assert.equal(result, true);
        });

        it('checkIfNeedToUpload match desktop css.', async function () {
            const result = instance.checkIfNeedToUpload("css/desktop1.css");
            chai.assert.equal(result, true);
        });

        it('checkIfNeedToUpload match mobile js.', async function () {
            const result = instance.checkIfNeedToUpload("js/mobile/mobile1.js");
            chai.assert.equal(result, true);
        });

        it('checkIfNeedToUpload does not match.', async function () {
            const result = instance.checkIfNeedToUpload("js/mobile/example_src.js");
            chai.assert.equal(result, false);
        });

        it('execRun timeout', async function () {
            const mutex = instance.getMutex();
            mutex.release = await mutex.obj.acquire();
            instance.execRun(-1);
            mutex.release = await mutex.obj.acquire();
            mutex.release();
        });

        it('execRun status get faild.', async function () {
            instance = srcUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/custom.manifest.error.1.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );
            const mutex = instance.getMutex();
            mutex.release = await mutex.obj.acquire();
            mutex.release();
        });

        it('upload_DesktopJs file not found.', async function () {
            const mutex = instance.getMutex();
            mutex.release = await mutex.obj.acquire();
            instance.upload_DesktopJs({
                desktop: {
                    js: [
                        {
                            type: "FILE",
                            file: {
                                name: "aa.js"
                            }
                        }
                    ],
                    css: []
                },
                mobile: {
                    js: []
                }
            });
            mutex.release = await mutex.obj.acquire();
            mutex.release();
        });

        it('upload_DesktopJs upload error.', async function () {
            const mutex = instance.getMutex();
            mutex.release = await mutex.obj.acquire();
            const tmp = instance.username;
            instance.username = "";
            instance.upload_DesktopJs({
                desktop: {
                    js: [
                        {
                            type: "FILE",
                            file: {
                                name: "js/desktop/desktop1.js"
                            }
                        }
                    ],
                    css: []
                },
                mobile: {
                    js: []
                }
            }, 0, 1);
            mutex.release = await mutex.obj.acquire();
            mutex.release();
            instance.username = tmp;
        });

        it('upload_DesktopCss file not found.', async function () {
            const mutex = instance.getMutex();
            mutex.release = await mutex.obj.acquire();
            instance.upload_DesktopCss({
                desktop: {
                    css: [
                        {
                            type: "FILE",
                            file: {
                                name: "aa.css"
                            }
                        }
                    ],
                    js: []
                },
                mobile: {
                    js: []
                }
            });
            mutex.release = await mutex.obj.acquire();
            mutex.release();
        });

        it('upload_DesktopCss upload error.', async function () {
            const mutex = instance.getMutex();
            mutex.release = await mutex.obj.acquire();
            const tmp = instance.username;
            instance.username = "";
            instance.upload_DesktopCss({
                desktop: {
                    css: [
                        {
                            type: "FILE",
                            file: {
                                name: "css/desktop1.css"
                            }
                        }
                    ],
                    js: []
                },
                mobile: {
                    js: []
                }
            }, 0, 1);
            mutex.release = await mutex.obj.acquire();
            mutex.release();
            instance.username = tmp;
        });

        it('upload_MobileJs file not found.', async function () {
            const mutex = instance.getMutex();
            mutex.release = await mutex.obj.acquire();
            instance.upload_MobileJs({
                desktop: {
                    css: [],
                    js: []
                },
                mobile: {
                    js: [
                        {
                            type: "FILE",
                            file: {
                                name: "aa.js"
                            }
                        }
                    ]
                }
            });
            mutex.release = await mutex.obj.acquire();
            mutex.release();
        });

        it('upload_MobileJs upload error.', async function () {
            const mutex = instance.getMutex();
            mutex.release = await mutex.obj.acquire();
            const tmp = instance.username;
            instance.username = "";
            instance.upload_MobileJs({
                desktop: {
                    css: [],
                    js: []
                },
                mobile: {
                    js: [
                        {
                            type: "FILE",
                            file: {
                                name: "js/mobile/mobile1.js"
                            }
                        }
                    ]
                }
            }, 0, 1);
            mutex.release = await mutex.obj.acquire();
            mutex.release();
            instance.username = tmp;
        });

        it('chageAppSettings error.', async function () {
            const mutex = instance.getMutex();
            mutex.release = await mutex.obj.acquire();
            instance.chageAppSettings({
                desktop: {
                    css: [],
                    js: []
                },
                mobile: {
                    js: [
                        {
                            type: "FILE",
                            file: {
                                name: "js/mobile/mobile1.js"
                            }
                        }
                    ]
                }
            }, 1);
            mutex.release = await mutex.obj.acquire();
            mutex.release();
        });

        it('deploy error.', async function () {
            const mutex = instance.getMutex();
            mutex.release = await mutex.obj.acquire();
            instance.deploy({}, 1)
            mutex.release = await mutex.obj.acquire();
            mutex.release();
        });

        it('Successful test of subject guest space apl.', async function () {

            instance = srcUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/custom.manifest.gest.success.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );

            const mutex = instance.getMutex();
            mutex.release = await mutex.obj.acquire();
            mutex.release();
        });

        it('Authentication error.', async function () {

            instance = srcUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                "aaaa",
                "test/test_data/custom.manifest.success.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );

            const mutex = instance.getMutex();
            mutex.release = await mutex.obj.acquire();
            mutex.release();
        });

        it('Invalid URI.', async function () {

            instance = srcUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/custom.manifest.success.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );

            const mutex = instance.getMutex();
            mutex.release = await mutex.obj.acquire();
            mutex.release();
        });

        it('No1 Invalid manifest json format.', async function () {

            instance = srcUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/custom.manifest.error.formaterror.1.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );

            const mutex = instance.getMutex();
            mutex.release = await mutex.obj.acquire();
            mutex.release();
        });

        it('No2 Invalid manifest json format.', async function () {

            instance = srcUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/custom.manifest.error.formaterror.2.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );

            const mutex = instance.getMutex();
            mutex.release = await mutex.obj.acquire();
            mutex.release();
        });

        it('Manifest file does not exist.', async function () {

            instance = srcUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/exapmle.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );

            const mutex = instance.getMutex();
            mutex.release = await mutex.obj.acquire();
            mutex.release();
        });

        afterEach(function () {
            process.exit.restore();
        });

        after(function () {

        });

    });

    describe('upload plugin source code test.', function () {
        'use strict';

        this.timeout(50000);
        var instance = null;

        before(function () { });

        beforeEach(function () {
            sinon.stub(process, 'exit');
        });

        it('upload success.', async function () {

            await pluginUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/jsEdit_plugin_v4.1.zip",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );
        });

        it('Invalid URI.', async function () {

            await pluginUpload_run(
                "",
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/jsEdit_plugin_v4.1.zip",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );

        });

        afterEach(function () {
            process.exit.restore();
        });

        after(function () { });

    });

    describe('upload portal source code test.', function () {
        'use strict';

        this.timeout(40000);
        var instance = null;

        before(function () { });

        beforeEach(function () {
            sinon.stub(process, 'exit');
        });

        it('upload success.', async function () {

            await portalUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/portal.manifest.success.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );
        });

        it('Invalid URI.', async function () {

            await portalUpload_run(
                "",
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/portal.manifest.success.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );
        });

        it('abort upload desktop js does not exist.', async function () {

            await portalUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/portal.manifest.error.djs.notfound.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );
        });

        it('abort upload desktop js specify a file that can not be specified.', async function () {

            await portalUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/portal.manifest.error.djs.error.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );
        });

        it('abort upload mobile js does not exist.', async function () {

            await portalUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/portal.manifest.error.mjs.notfound.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );
        });

        it('abort upload mobile js specify a file that can not be specified.', async function () {

            await portalUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/portal.manifest.error.mjs.error.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );
        });

        it('abort upload desktop css does not exist.', async function () {

            await portalUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/portal.manifest.error.dcss.notfound.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );
        });

        it('abort upload desktop css specify a file that can not be specified.', async function () {

            await portalUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/portal.manifest.error.dcss.error.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );
        });

        it('No1 Invalid manifest json format.', async function () {

            await portalUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/portal.manifest.fomat.error.1.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );
        });

        it('No2 Invalid manifest json format.', async function () {

            await portalUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/portal.manifest.fomat.error.2.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );
        });

        it('Manifest file does not exist.', async function () {

            await portalUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/example.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );
        });

        afterEach(function () {
            process.exit.restore();
        });

        after(function () { });

    });

})();
