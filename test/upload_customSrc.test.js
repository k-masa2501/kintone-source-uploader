(function() {

    const { srcUpload_run } = require("../dist/upload_customSrc");
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


    describe('upload customize source code.', function() {
        'use strict';

        this.timeout(30000);
		var instance = null;

        before(function() {});

        beforeEach(function () { });

        it('upload success.', async function() {

            instance = srcUpload_run(
				process.env.KINTONE_DOMAIN, 
				process.env.KINTONE_USERNAME, 
				process.env.KINTONE_PASSWORD,
				"test\\test_data\\custom.manifest.success.json",
				{lang: "ja", proxyServer: null}
			);

			const mutex = instance.getMutex();
			mutex.release = await mutex.obj.acquire();
			mutex.release();
        });

        it('upload wait 3 second.',async function() {
            instance = srcUpload_run(
				process.env.KINTONE_DOMAIN, 
				process.env.KINTONE_USERNAME, 
				process.env.KINTONE_PASSWORD,
				"test\\test_data\\custom.manifest.success.json",
				{lang: "ja", proxyServer: null}
			);
			const mutex = instance.getMutex();
			mutex.release = await mutex.obj.acquire();
			mutex.release();
        });

		it('checkIfNeedToUpload match manifest file.', async function() {
			const mutex = instance.getMutex();
			mutex.release = await mutex.obj.acquire();
            const result = instance.checkIfNeedToUpload("custom.manifest.success.json");
			chai.assert.equal(result, true);
			mutex.release();
        });

        it('checkIfNeedToUpload match desktop js.', async function() {
			const mutex = instance.getMutex();
			mutex.release = await mutex.obj.acquire();
            const result = instance.checkIfNeedToUpload("js/desktop/desktop1.js");
			chai.assert.equal(result, true);
			mutex.release();
        });

        it('checkIfNeedToUpload match desktop css.', async function() {
			const mutex = instance.getMutex();
			mutex.release = await mutex.obj.acquire();
            const result = instance.checkIfNeedToUpload("css/desktop1.css");
			chai.assert.equal(result, true);
			mutex.release();
        });

        it('checkIfNeedToUpload match mobile js.', async function() {
			const mutex = instance.getMutex();
			mutex.release = await mutex.obj.acquire();
            const result = instance.checkIfNeedToUpload("js/mobile/mobile1.js");
			chai.assert.equal(result, true);
			mutex.release();
        });

        it('checkIfNeedToUpload does not match.', async function() {
			const mutex = instance.getMutex();
			mutex.release = await mutex.obj.acquire();
            const result = instance.checkIfNeedToUpload("js/mobile/example.js");
			chai.assert.equal(result, false);
			mutex.release();
        });

        it('execRun timeout', async function() {
			const mutex = instance.getMutex();
			mutex.release = await mutex.obj.acquire();
            instance.execRun(-1);
			mutex.release = await mutex.obj.acquire();
			mutex.release();
        });

        it('execRun status get faild.', async function() {
            instance = srcUpload_run(
				process.env.KINTONE_DOMAIN, 
				process.env.KINTONE_USERNAME, 
				process.env.KINTONE_PASSWORD,
				"test\\test_data\\custom.manifest.error.1.json",
				{lang: "ja", proxyServer: null}
			);
			const mutex = instance.getMutex();
			mutex.release = await mutex.obj.acquire();
			mutex.release();
        });

        it('upload_DesktopJs file not found.', async function() {
			const mutex = instance.getMutex();
			mutex.release = await mutex.obj.acquire();
            instance.upload_DesktopJs({
				desktop:{
					js:[
						{
							type: "FILE",
							file:{
								name: "aa.js"
							}
						}
					],
					css:[]
				},
				mobile:{
					js:[]
				}
			});
			mutex.release = await mutex.obj.acquire();
			mutex.release();
        });

        it('upload_DesktopJs upload error.', async function() {
			const mutex = instance.getMutex();
			mutex.release = await mutex.obj.acquire();
			const tmp = instance.username;
			instance.username = "";
            instance.upload_DesktopJs({
				desktop:{
					js:[
						{
							type: "FILE",
							file:{
								name: "js/desktop/desktop1.js"
							}
						}
					],
					css:[]
				},
				mobile:{
					js:[]
				}
			},0,1);
			mutex.release = await mutex.obj.acquire();
			mutex.release();
			instance.username = tmp;
        });

        it('upload_DesktopCss file not found.', async function() {
			const mutex = instance.getMutex();
			mutex.release = await mutex.obj.acquire();
            instance.upload_DesktopCss({
				desktop:{
					css:[
						{
							type: "FILE",
							file:{
								name: "aa.css"
							}
						}
					],
					js:[]
				},
				mobile:{
					js:[]
				}
			});
			mutex.release = await mutex.obj.acquire();
			mutex.release();
        });

        it('upload_DesktopCss upload error.', async function() {
			const mutex = instance.getMutex();
			mutex.release = await mutex.obj.acquire();
			const tmp = instance.username;
			instance.username = "";
            instance.upload_DesktopCss({
				desktop:{
					css:[
						{
							type: "FILE",
							file:{
								name: "css/desktop1.css"
							}
						}
					],
					js:[]
				},
				mobile:{
					js:[]
				}
			},0,1);
			mutex.release = await mutex.obj.acquire();
			mutex.release();
			instance.username = tmp;
        });

		it('upload_MobileJs file not found.', async function() {
			const mutex = instance.getMutex();
			mutex.release = await mutex.obj.acquire();
            instance.upload_MobileJs({
				desktop:{
					css:[],
					js:[]
				},
				mobile:{
					js:[
						{
							type: "FILE",
							file:{
								name: "aa.js"
							}
						}
					]
				}
			});
			mutex.release = await mutex.obj.acquire();
			mutex.release();
        });

        it('upload_MobileJs upload error.', async function() {
			const mutex = instance.getMutex();
			mutex.release = await mutex.obj.acquire();
			const tmp = instance.username;
			instance.username = "";
            instance.upload_MobileJs({
				desktop:{
					css:[],
					js:[]
				},
				mobile:{
					js:[
						{
							type: "FILE",
							file:{
								name: "js/mobile/mobile1.js"
							}
						}
					]
				}
			},0,1);
			mutex.release = await mutex.obj.acquire();
			mutex.release();
			instance.username = tmp;
        });

        it('chageAppSettings error.', async function() {
			const mutex = instance.getMutex();
			mutex.release = await mutex.obj.acquire();
            instance.chageAppSettings({
				desktop:{
					css:[],
					js:[]
				},
				mobile:{
					js:[
						{
							type: "FILE",
							file:{
								name: "js/mobile/mobile1.js"
							}
						}
					]
				}
			},1);
			mutex.release = await mutex.obj.acquire();
			mutex.release();
        });

        it('deploy error.', async function() {
			const mutex = instance.getMutex();
			mutex.release = await mutex.obj.acquire();
            instance.deploy({},1)
			mutex.release = await mutex.obj.acquire();
			mutex.release();
        });

        it('Successful test of subject guest space apl.', async function() {

            instance = srcUpload_run(
				process.env.KINTONE_DOMAIN, 
				process.env.KINTONE_USERNAME, 
				process.env.KINTONE_PASSWORD,
				"test\\test_data\\custom.manifest.gest.success.json",
				{lang: "ja", proxyServer: null}
			);

			const mutex = instance.getMutex();
			mutex.release = await mutex.obj.acquire();
			mutex.release();
        });

        it('Authentication error.', async function() {

            instance = srcUpload_run(
				process.env.KINTONE_DOMAIN, 
				process.env.KINTONE_USERNAME, 
				"aaaa",
				"test\\test_data\\custom.manifest.success.json",
				{lang: "ja", proxyServer: null}
			);

			const mutex = instance.getMutex();
			mutex.release = await mutex.obj.acquire();
			mutex.release();
        });

        it('Invalid URI.', async function() {

            instance = srcUpload_run(
				"sample", 
				process.env.KINTONE_USERNAME, 
				process.env.KINTONE_PASSWORD,
				"test\\test_data\\custom.manifest.success.json",
				{lang: "ja", proxyServer: null}
			);

			const mutex = instance.getMutex();
			mutex.release = await mutex.obj.acquire();
			mutex.release();
        });

        afterEach(function() {});

        after(function() {});

    });

});
