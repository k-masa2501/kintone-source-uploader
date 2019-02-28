(function() {

    const { portalUpload_run } = require("../dist/upload_portalSrc.js");
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

        it('upload success.', function() {

            portalUpload_run(
				process.env.KINTONE_DOMAIN,
				process.env.KINTONE_USERNAME,
				process.env.KINTONE_PASSWORD,
				"test\\test_data\\portal.manifest.success.json",
				{lang: "ja", proxyServer: null}
			); 
        });

        it('abort upload desktop js does not exist.', function(done) {

			sleep(1000).then(async function(){
				await portalUpload_run(
					process.env.KINTONE_DOMAIN,
					process.env.KINTONE_USERNAME,
					process.env.KINTONE_PASSWORD,
					"test\\test_data\\portal.manifest.error.djs.notfound.json",
					{lang: "ja", proxyServer: null}
				); 
				done();
			});

        });

        it('abort upload desktop js format error.',function(done) {

			sleep(1000).then(async function(){
				await portalUpload_run(
					process.env.KINTONE_DOMAIN,
					process.env.KINTONE_USERNAME,
					process.env.KINTONE_PASSWORD,
					"test\\test_data\\portal.manifest.error.djs.formaterror.json",
					{lang: "ja", proxyServer: null}
				);
				done();
			});

        });

        afterEach(function() {});

        after(function() {});

    });

});