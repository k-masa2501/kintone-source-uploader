// Copyright (c) 2018 Cybozu, Inc.
// Released under the MIT license
// https://github.com/kintone/plugin-uploader/blob/master/LICENSE

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
import _chalk_ from "chalk";
const chalk_1 = __importDefault(_chalk_);
import _fs_ from "fs";
const fs_1 = __importDefault(_fs_);
import _puppeteer_ from "puppeteer";
const puppeteer_1 = __importDefault(_puppeteer_);
import { getBoundMessage}  from "./messages.js";
const messages_1 = { getBoundMessage };
const TIMEOUT_MS = 30000;
var proxyUserId = null;
var proxyPasswd = null;

function analysisProxyStr(proxy){
    // 0:"full", 1:http or https, 2;"user:pass@", 3:"user", 4:"pass", 5:"proxyAddr", 6:":proxyPort", 7:"proxyPort"
    return (function(array){
        for(var i=0; i<array.length; i++){array[i] = array[i] == undefined || array[i] == null ? "":array[i];}
        return array;
    })(proxy.match(/^(http|https):\/\/(([A-Za-z0-9\.@]+):*([A-Za-z0-9]*)@)*([A-Za-z0-9\.]*)(:([0-9]*$))*/))
}

function launchBrowser(proxy) {
    return __awaiter(this, void 0, void 0, function* () {
        var args = [
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ];
        if (proxy){
            var _proxy = analysisProxyStr(proxy);
            proxyUserId = _proxy[3];
            proxyPasswd = _proxy[4];
            args.push(`--proxy-server=${_proxy[5]}:${_proxy[7]}`);
        }
        return yield puppeteer_1.default.launch({ args });
    });
}
function readyForUpload(browser, domain, userName, password, lang) {
    return __awaiter(this, void 0, void 0, function* () {
        const m = messages_1.getBoundMessage(lang);
        const page = yield browser.newPage();
        
        page.authenticate({
            username: proxyUserId,
            password: proxyPasswd
        });
        
        const kintoneUrl = `https://${domain}/`;
        const loginUrl = `${kintoneUrl}login?saml=off`;
        console.log(`Open ${loginUrl}`);
        yield page.goto(loginUrl);
        try {
            yield page.waitFor(".form-username-slash", { timeout: TIMEOUT_MS });
        }
        catch (e) {
            console.log(chalk_1.default.red(m("Error_cannotOpenLogin")));
            process.exit(1);
        }
        console.log("Trying to log in...");
        yield page.type(".form-username-slash > input.form-text", userName);
        yield page.type(".form-password-slash > input.form-text", password);
        yield page.click(".login-button");
        try {
            yield page.waitForNavigation({
                timeout: TIMEOUT_MS,
                waitUntil: "domcontentloaded"
            });
        }
        catch (e) {
            console.log(chalk_1.default.red(m("Error_failedLogin")));
            process.exit(1);
        }
        const pluginUrl = `${kintoneUrl}k/admin/system/plugin/`;
        console.log(`Navigate to ${pluginUrl}`);
        yield page.goto(pluginUrl);
        try {
            yield page.waitForSelector("#page-admin-system-plugin-index-addplugin", {
                timeout: TIMEOUT_MS
            });
        }
        catch (e) {
            console.log(chalk_1.default.red(m("Error_adminPrivilege")));
            process.exit(1);
        }
        return page;
    });
}
function upload(page, pluginPath, lang) {
    return __awaiter(this, void 0, void 0, function* () {

        async function sleep(delay) {
            return new Promise(resolve => setTimeout(resolve, delay));
        }

        const m = messages_1.getBoundMessage(lang);

        console.log(`Trying to upload ${pluginPath}`);
        yield page.click("#page-admin-system-plugin-index-addplugin");
        const file = yield page.$('.plupload > input[type="file"]');
        if (file == null) {
            throw new Error('input[type="file"] cannot find');
        }
        yield file.uploadFile(pluginPath);
        yield page.click('button[name="ok"]');
        
        try{
        	yield page.waitForSelector(".ocean-ui-dialog", {
            	hidden: true,
            	timeout: TIMEOUT_MS
        	});
        }catch(e){
            throw new Error(`upload faild.reason: ${e.message}`);
        }
        
        console.log(`${pluginPath} ${m("Uploaded")}`);
    });
}
function run(domain, userName, password, pluginPath, options) {

    const { lang } = options;
    const m = messages_1.getBoundMessage(lang);
    if (!pluginPath) {
        console.error(m("Error_requiredZipPath"));
        process.exit(1);
    }

    return __awaiter(this, void 0, void 0, function* () {
        let browser = yield launchBrowser(options.proxyServer);
        let page;
        const { lang } = options;
        const m = messages_1.getBoundMessage(lang);
        try {
            page = yield readyForUpload(browser, domain, userName, password, lang);
            yield upload(page, pluginPath, lang);
            if (options.watch) {
                let uploading = false;
                fs_1.default.watch(pluginPath, () => __awaiter(this, void 0, void 0, function* () {
                    if (uploading) {
                        return;
                    }
                    try {
                        uploading = true;
                        yield upload(page, pluginPath, lang);
                    }
                    catch (e) {
                        console.log(e);
                        console.log(m("Error_retry"));
                        yield browser.close();
                        browser = yield launchBrowser(options.proxyServer);
                        page = yield readyForUpload(browser, domain, userName, password, lang);
                        yield upload(page, pluginPath, lang);
                    }
                    finally {
                        uploading = false;
                    }
                }));
            }
            else {
                yield browser.close();
                process.exit(0);
            }
        }
        catch (e) {
            console.error(m("Error"), e);
            yield browser.close();
            process.exit(1);
        }
    });
}

const pluginUpload_run = run;
export { pluginUpload_run };
