(function() {

	const { pluginUpload_run } = require("../dist/upload_plugin.js");
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


    describe('upload plugin source code.', function() {
        'use strict';

        this.timeout(50000);
		var instance = null;

        before(function() {});

        beforeEach(function () { });

        it('upload success.', async function() {
			
			sinon.stub(process, 'exit');
            await pluginUpload_run(
				process.env.KINTONE_DOMAIN,
				process.env.KINTONE_USERNAME,
				process.env.KINTONE_PASSWORD,
				"test\\test_data\\jsEdit_plugin_v4.1.zip",
				{lang: "ja", proxyServer: null}
			); 

        });

		it('Authentication error.', async function() {
			
			sinon.stub(process, 'exit');
            pluginUpload_run(
				process.env.KINTONE_DOMAIN,
				process.env.KINTONE_USERNAME,
				"",
				"test\\test_data\\jsEdit_plugin_v4.1.zip",
				{lang: "ja", proxyServer: null}
			); 

			await sleep(35000);

        });

        it('Invalid URI.', async function() {
			
			sinon.stub(process, 'exit');
            pluginUpload_run(
				"",
				process.env.KINTONE_USERNAME,
				process.env.KINTONE_PASSWORD,
				"test\\test_data\\jsEdit_plugin_v4.1.zip",
				{lang: "ja", proxyServer: null}
			); 

			await sleep(35000);

        });

        afterEach(function() {
			process.exit.restore();
		});

        after(function() {});

    });

})();