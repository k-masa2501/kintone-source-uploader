import { run } from "../dist/index.js";
import  customizeUpload_run  from "../dist/upload_customizeSrc.js";
import { pluginUpload_run } from "../dist/upload_plugin.js";
import { portalUpload_run } from "../dist/upload_portalSrc.js";
import sinon from 'sinon';
import chai from 'chai';
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
    before(function () { });
    beforeEach(function () {
        sinon.stub(process, 'exit');
    });
    it('upload success.', async function () {
        var instance = customizeUpload_run(
            process.env.KINTONE_DOMAIN,
            process.env.KINTONE_USERNAME,
            process.env.KINTONE_PASSWORD,
            "test/test_data/custom.manifest.success.json",
            { lang: "ja", proxyServer: process.env.HTTP_PROXY }
        );
        var result = await instance.uploadRun();
        chai.assert.equal(result, 0);
            
    });
    it('checkNeedToSourceUpload match manifest file.', function () {
        var instance = customizeUpload_run(
            process.env.KINTONE_DOMAIN,
            process.env.KINTONE_USERNAME,
            process.env.KINTONE_PASSWORD,
            "test/test_data/custom.manifest.success.json",
            { lang: "ja", proxyServer: process.env.HTTP_PROXY }
        );
        var result = instance.checkNeedToSourceUpload("custom.manifest.success.json");
        chai.assert.equal(result, true);
    });
    it('checkNeedToSourceUpload match desktop js.', function () {
        var instance = customizeUpload_run(
            process.env.KINTONE_DOMAIN,
            process.env.KINTONE_USERNAME,
            process.env.KINTONE_PASSWORD,
            "test/test_data/custom.manifest.success.json",
            { lang: "ja", proxyServer: process.env.HTTP_PROXY }
        );
        var result = instance.checkNeedToSourceUpload("js/desktop/desktop1.js");
        chai.assert.equal(result, true);
    });
    it('checkNeedToSourceUpload match desktop css.', function () {
        var instance = customizeUpload_run(
            process.env.KINTONE_DOMAIN,
            process.env.KINTONE_USERNAME,
            process.env.KINTONE_PASSWORD,
            "test/test_data/custom.manifest.success.json",
            { lang: "ja", proxyServer: process.env.HTTP_PROXY }
        );
        var result = instance.checkNeedToSourceUpload("css/desktop1.css");
        chai.assert.equal(result, true);
    });
    it('checkNeedToSourceUpload match mobile js.', function () {
        var instance = customizeUpload_run(
            process.env.KINTONE_DOMAIN,
            process.env.KINTONE_USERNAME,
            process.env.KINTONE_PASSWORD,
            "test/test_data/custom.manifest.success.json",
            { lang: "ja", proxyServer: process.env.HTTP_PROXY }
        );
        var result = instance.checkNeedToSourceUpload("js/mobile/mobile1.js");
        chai.assert.equal(result, true);
    });
    it('checkNeedToSourceUpload does not match.', function () {
        var instance = customizeUpload_run(
            process.env.KINTONE_DOMAIN,
            process.env.KINTONE_USERNAME,
            process.env.KINTONE_PASSWORD,
            "test/test_data/custom.manifest.success.json",
            { lang: "ja", proxyServer: process.env.HTTP_PROXY }
        );
        var result = instance.checkNeedToSourceUpload("example_src.js");
        chai.assert.equal(result, false);
    });
    
    it('upload_DesktopJs file not found.', async function () {
        var instance = customizeUpload_run(
            process.env.KINTONE_DOMAIN,
            process.env.KINTONE_USERNAME,
            process.env.KINTONE_PASSWORD,
            "test/test_data/custom.manifest.success.json",
            { lang: "ja", proxyServer: process.env.HTTP_PROXY }
        );
        var result = await instance.upload_DesktopJs({
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
        chai.assert.equal(result, -1);
    });
    
    it('upload_DesktopJs upload error.', async function () {
        var instance = customizeUpload_run(
            process.env.KINTONE_DOMAIN,
            process.env.KINTONE_USERNAME,
            process.env.KINTONE_PASSWORD,
            "test/test_data/custom.manifest.success.json",
            { lang: "ja", proxyServer: process.env.HTTP_PROXY }
        );
        instance.username = "";
        var result = await instance.upload_DesktopJs({
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
        chai.assert.equal(result, -1);
    });
    it('upload_DesktopCss file not found.', async function () {
        var instance = customizeUpload_run(
            process.env.KINTONE_DOMAIN,
            process.env.KINTONE_USERNAME,
            process.env.KINTONE_PASSWORD,
            "test/test_data/custom.manifest.success.json",
            { lang: "ja", proxyServer: process.env.HTTP_PROXY }
        );
        var result = await instance.upload_DesktopCss({
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
        chai.assert.equal(result, -1);
    });
    it('upload_DesktopCss upload error.', async function () {
        var instance = customizeUpload_run(
            process.env.KINTONE_DOMAIN,
            process.env.KINTONE_USERNAME,
            process.env.KINTONE_PASSWORD,
            "test/test_data/custom.manifest.success.json",
            { lang: "ja", proxyServer: process.env.HTTP_PROXY }
        );
        instance.username = "";
        var result = await instance.upload_DesktopCss({
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
        chai.assert.equal(result, -1);
    });
    it('upload_MobileJs file not found.', async function () {
        var instance = customizeUpload_run(
            process.env.KINTONE_DOMAIN,
            process.env.KINTONE_USERNAME,
            process.env.KINTONE_PASSWORD,
            "test/test_data/custom.manifest.success.json",
            { lang: "ja", proxyServer: process.env.HTTP_PROXY }
        );
        var result = await instance.upload_MobileJs({
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
        chai.assert.equal(result, -1);
    });
    it('upload_MobileJs upload error.', async function () {
        var instance = customizeUpload_run(
            process.env.KINTONE_DOMAIN,
            process.env.KINTONE_USERNAME,
            process.env.KINTONE_PASSWORD,
            "test/test_data/custom.manifest.success.json",
            { lang: "ja", proxyServer: process.env.HTTP_PROXY }
        );
        instance.username = "";
        var result = await instance.upload_MobileJs({
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
        chai.assert.equal(result, -1);
    });
    it('chageAppSettings error.', async function () {
        var instance = customizeUpload_run(
            process.env.KINTONE_DOMAIN,
            process.env.KINTONE_USERNAME,
            process.env.KINTONE_PASSWORD,
            "test/test_data/custom.manifest.success.json",
            { lang: "ja", proxyServer: process.env.HTTP_PROXY }
        );
        var result = await instance.chageAppSettings({
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
                ],
                css: []
            }
        }, 1);
        chai.assert.equal(result, -1);
    });
    it('deploy error.', async function () {
        var instance = customizeUpload_run(
            process.env.KINTONE_DOMAIN,
            process.env.KINTONE_USERNAME,
            process.env.KINTONE_PASSWORD,
            "test/test_data/custom.manifest.success.json",
            { lang: "ja", proxyServer: process.env.HTTP_PROXY }
        );
        var result = await instance.deploy({}, 1);
        
        chai.assert.equal(result, -1);
    });
    it('Successful test of subject guest space apl.', async function () {
        var instance = customizeUpload_run(
            process.env.KINTONE_DOMAIN,
            process.env.KINTONE_USERNAME,
            process.env.KINTONE_PASSWORD,
            "test/test_data/custom.manifest.gest.success.json",
            { lang: "ja", proxyServer: process.env.HTTP_PROXY }
        );
        var result = await instance.uploadRun();
        chai.assert.equal(result, 0);
        
    });
    it('Authentication error.', async function () {
        var instance = customizeUpload_run(
            process.env.KINTONE_DOMAIN,
            process.env.KINTONE_USERNAME,
            "aaaa",
            "test/test_data/custom.manifest.success.json",
            { lang: "ja", proxyServer: process.env.HTTP_PROXY }
        );
        var result = await instance.uploadRun();
        chai.assert.equal(result, -1);
    });
    it('No1 Invalid manifest json format.', function () {
        chai.expect(() =>{customizeUpload_run(
            process.env.KINTONE_DOMAIN,
            process.env.KINTONE_USERNAME,
            process.env.KINTONE_PASSWORD,
            "test/test_data/custom.manifest.error.formaterror.1.json",
            { lang: "ja", proxyServer: process.env.HTTP_PROXY }
        )}).to.throw(Error)
    });
    it('No2 Invalid manifest json format.', async function () {
        chai.expect(() =>{customizeUpload_run(
            process.env.KINTONE_DOMAIN,
            process.env.KINTONE_USERNAME,
            process.env.KINTONE_PASSWORD,
            "test/test_data/custom.manifest.error.formaterror.2.json",
            { lang: "ja", proxyServer: process.env.HTTP_PROXY }
        )}).to.throw(Error)
    });
    it('Manifest file does not exist.', async function () {
        chai.expect(() =>{customizeUpload_run(
            process.env.KINTONE_DOMAIN,
            process.env.KINTONE_USERNAME,
            process.env.KINTONE_PASSWORD,
            "test/test_data/exapmle.json",
            { lang: "ja", proxyServer: process.env.HTTP_PROXY }
        )}).to.throw(Error)
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
    it('upload faild.', async function () {
        await pluginUpload_run(
            process.env.KINTONE_DOMAIN,
            process.env.KINTONE_USERNAME,
            process.env.KINTONE_PASSWORD,
            "test/test_data/plugin_error.zip",
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
    it('all js upload success.', async function () {
        await portalUpload_run(
            process.env.KINTONE_DOMAIN,
            process.env.KINTONE_USERNAME,
            process.env.KINTONE_PASSWORD,
            "test/test_data/portal.manifest.success.all.json",
            { lang: "ja", proxyServer: process.env.HTTP_PROXY, all: true }
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