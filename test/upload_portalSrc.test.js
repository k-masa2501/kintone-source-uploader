(function() {

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

    describe('upload portal source code.', function() {
        'use strict';

        this.timeout(40000);
		var instance = null;

        before(function() {});

        beforeEach(function () { });

        it('upload success.', async function() {

            sinon.stub(process, 'exit');
            await portalUpload_run(
				process.env.KINTONE_DOMAIN,
				process.env.KINTONE_USERNAME,
				process.env.KINTONE_PASSWORD,
				"test/test_data/portal.manifest.success.json",
				{lang: "ja", proxyServer: process.env.HTTP_PROXY}
			); 
        });

        it('Invalid URI.', async function () {

            sinon.stub(process, 'exit');
            await portalUpload_run(
                "",
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/portal.manifest.success.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );
        });

        it('abort upload desktop js does not exist.', async function() {

            sinon.stub(process, 'exit');
            await portalUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/portal.manifest.error.djs.notfound.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            ); 
        });

        it('abort upload desktop js specify a file that can not be specified.',async function() {

            sinon.stub(process, 'exit');
            await portalUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/portal.manifest.error.djs.error.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );
        });

        it('abort upload mobile js does not exist.', async function () {

            sinon.stub(process, 'exit');
            await portalUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/portal.manifest.error.mjs.notfound.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );
        });

        it('abort upload mobile js specify a file that can not be specified.', async function () {

            sinon.stub(process, 'exit');
            await portalUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/portal.manifest.error.mjs.error.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );
        });
        
        it('abort upload desktop css does not exist.', async function () {

            sinon.stub(process, 'exit');
            await portalUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/portal.manifest.error.dcss.notfound.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );
        });

        it('abort upload desktop css specify a file that can not be specified.', async function () {

            sinon.stub(process, 'exit');
            await portalUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/portal.manifest.error.dcss.error.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );
        });

        it('No1 Invalid manifest json format.', async function () {

            sinon.stub(process, 'exit');
            await portalUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/portal.manifest.fomat.error.1.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );
        });

        it('No2 Invalid manifest json format.', async function () {

            sinon.stub(process, 'exit');
            await portalUpload_run(
                process.env.KINTONE_DOMAIN,
                process.env.KINTONE_USERNAME,
                process.env.KINTONE_PASSWORD,
                "test/test_data/portal.manifest.fomat.error.2.json",
                { lang: "ja", proxyServer: process.env.HTTP_PROXY }
            );
        });

        it('Manifest file does not exist.', async function () {

            sinon.stub(process, 'exit');
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

        after(function() {});

    });

})();