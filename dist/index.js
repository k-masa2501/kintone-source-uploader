// Copyright (c) 2018 Cybozu, Inc.
// Released under the MIT license
// https://github.com/kintone/plugin-uploader/blob/master/LICENSE

"use strict";

import { inquireParams } from "../dist/params.js";
import  customizeUpload_run  from "../dist/upload_customizeSrc.js";
import { portalUpload_run } from "../dist/upload_portalSrc.js";
import { pluginUpload_run } from "../dist/upload_plugin.js";

function run(
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
        all
    }, 
    pluginPath, showhelp) {

    const options = proxy ? { 
        watch, 
        lang, 
        proxyServer: proxy,
        all 
    } : { 
        watch, 
        lang, 
        proxyServer: null,
        all
    };

    const wait = ms => new Promise(r => setTimeout(r, ms));

    wait(waitingDialogMs)
        .then(() => inquireParams({ username, password, domain, lang }))
        .then(({ username, password, domain }) => {
            if (customSrc){
                return customizeUpload_run(domain, username, password, customSrc, options).run();
            } else if (portalSrc){
                return portalUpload_run(domain, username, password, portalSrc, options);
            } else if (pluginPath){
                return pluginUpload_run(domain, username, password, pluginPath, options);                
            }else{
                showhelp();
            }
        });
}

export  { run };
