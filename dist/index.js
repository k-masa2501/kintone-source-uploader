// Copyright (c) 2018 Cybozu, Inc.
// Released under the MIT license
// https://github.com/kintone/plugin-uploader/blob/master/LICENSE

"use strict";

const { inquireParams } = require("../dist/params");
const { customizeUpload_run } = require("../dist/upload_customizeSrc");
const { portalUpload_run } = require("../dist/upload_portalSrc");
const { pluginUpload_run } = require("../dist/upload_plugin");
const { getMessage } = require("../dist/messages");

function run({username, password, domain, proxy, watch, waitingDialogMs, lang, customSrc, portalSrc }, pluginPath, showhelp) {

    const options = proxy ? { watch, lang, proxyServer: proxy } : { watch, lang, proxyServer: null };

    const wait = ms => new Promise(r => setTimeout(r, ms));

    wait(waitingDialogMs)
        .then(() => inquireParams({ username, password, domain, lang }))
        .then(({ username, password, domain }) => {
            if (customSrc){
                return customizeUpload_run(domain, username, password, customSrc, options);
            } else if (portalSrc){
                return portalUpload_run(domain, username, password, portalSrc, options);
            } else if (pluginPath){
                return pluginUpload_run(domain, username, password, pluginPath, options);                
            }else{
                showhelp();
            }
        });
}

exports.run = run;
