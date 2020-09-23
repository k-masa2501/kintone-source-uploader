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
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const messages_1 = __importDefault(require("./messages"));
const { Validator } = require('jsonschema');
const path = require('path');
const os = require('os');

const TIMEOUT_MS = 30000;
const TIMEOUT_MS100 = 100;
var proxyUserId = null;
var proxyPasswd = null;
var msg = null;

function analysisProxyStr(proxy) {
    // 0:"full", 1:http or https, 2;"user:pass@", 3:"user", 4:"pass", 5:"proxyAddr", 6:":proxyPort", 7:"proxyPort"
    return (function (array) {
        for (var i = 0; i < array.length; i++) { array[i] = array[i] == undefined || array[i] == null ? "" : array[i]; }
        return array;
    })(proxy.match(/^(http|https):\/\/(([A-Za-z0-9\.@]+):*([A-Za-z0-9]*)@)*([A-Za-z0-9\.]*)(:([0-9]*$))*/));
}

function launchBrowser(proxy) {
    return __awaiter(this, void 0, void 0, function* () {
        var args = [
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ];
        if (proxy) {
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
        } catch (e) {
            console.log(chalk_1.default.red(msg("Error_cannotOpenLogin")));
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
        } catch (e) {
            console.log(chalk_1.default.red(msg("Error_failedLogin")));
            process.exit(1);
        }
        const customizeUrl = `${kintoneUrl}k/admin/system/customize/`;
        console.log(`Navigate to ${customizeUrl}`);
        yield page.goto(customizeUrl);
        return page;
    });
}

function itemDelete(page, fileName, selector){
    return __awaiter(this, void 0, void 0, function* () {
        const removeDivs = yield page.$$(selector);
        var aTag = null;
        var textHundle = null;
        var text = null;
        var deleteTag = null;

        for (var i1 = 0; i1 < removeDivs.length; i1++) {
            aTag = yield removeDivs[i1].$('.plupload_file_name a');
            if (!(yield aTag)){continue;}

            textHundle = yield aTag.getProperty('textContent');
            text = yield textHundle.jsonValue();

            if (text === fileName){
                deleteTag = yield removeDivs[i1].$("[id*=-pre-remove]");
                if (yield deleteTag){
                    yield deleteTag.click();
                }
            }
        }

        return;
    });
}

function desktopJsItemDelete(page, filePath){
    return __awaiter(this, void 0, void 0, function* () {
        var fileName = filePath.split("/");
        fileName = fileName[fileName.length-1];
        yield itemDelete(page, fileName, "#jsFiles_DESKTOP-filelist > div");
        return;
    });
}

function desktopCssItemDelete(page, filePath){
    return __awaiter(this, void 0, void 0, function* () {
        var fileName = filePath.split("/");
        fileName = fileName[fileName.length-1];
        yield itemDelete(page, fileName, "#jsFiles_DESKTOP_CSS-filelist > div");
        return;
    });
}

function mobileJsItemDelete(page, filePath){
    return __awaiter(this, void 0, void 0, function* () {
        var fileName = filePath.split("/");
        fileName = fileName[fileName.length-1];
        yield itemDelete(page, fileName, "#jsFiles_MOBILE-filelist > div");
        return;
    });
}

function mobileCssItemDelete(page, filePath){
    return __awaiter(this, void 0, void 0, function* () {
        var fileName = filePath.split("/");
        fileName = fileName[fileName.length-1];
        yield itemDelete(page, fileName, "#jsFiles_MOBILE_CSS-filelist > div");
        return;
    });
}

function upload(page, lang, all) {
    return __awaiter(this, void 0, void 0, function* () {

        async function sleep(delay) {
            return new Promise(resolve => setTimeout(resolve, delay));
        }

        // 既にアップロード済みのファイルを解除
        if (all){
            const removeList = yield page.$$("[id*=-pre-remove]");
            for (var i3 = 0; i3 < removeList.length; i3++) {
                yield removeList[i3].click();
            }
        }

        const jsCssItem = yield page.$$(".plupload");

        /**** デスクトップ用Javascript ****/
        console.log(`\nTrying to desktop js upload..`);
        const desktopJs = yield jsCssItem[0].$('.plupload > input[type="file"]');
        if (desktopJs == null) {
			throw new Error('input[type="file"] cannot find');
        }

        for (var i2 = 0, len = manifest.json.desktop.js.length; i2 < len; i2++) {
            console.log(`Trying to upload ${manifest.json.desktop.js[i2]}`);
            if (manifest.fileCheck(`${manifest.path}/${manifest.json.desktop.js[i2]}`)){
                if (!all){ yield desktopJsItemDelete(page, manifest.json.desktop.js[i2]);}
                yield desktopJs.uploadFile(`${manifest.path}/${manifest.json.desktop.js[i2]}`);
            }else{
                console.error(`Abort upload!! [${manifest.json.desktop.js[i2]}] does not exist.`);
                return false;
            }
            
            yield sleep(100);
            if (yield page.$("#jsFiles_DESKTOP-container + .input-error-cybozu")) {
                console.error(`Abort upload!! ${manifest.json.desktop.js[i2]}：${msg('Upload_NotPermittedFormat')}`);
				return false;
            }
        }

        /**** モバイル用Javascript ****/
        console.log(`\nTrying to mobile js upload..`);
        const mobilejs = yield jsCssItem[1].$('.plupload > input[type="file"]');
        if (mobilejs == null) {
			console.log(chalk_1.default.red('input[type="file"] cannot find'));
            process.exit(1);
        }

        for (var i4 = 0, len = manifest.json.mobile.js.length; i4 < len; i4++) {
            console.log(`Trying to upload ${manifest.json.mobile.js[i4]}`);
            if (manifest.fileCheck(`${manifest.path}/${manifest.json.mobile.js[i4]}`)) {
                if (!all){ yield mobileJsItemDelete(page, manifest.json.mobile.js[i4]);}
                yield mobilejs.uploadFile(`${manifest.path}/${manifest.json.mobile.js[i4]}`);
            } else {
                console.error(`Abort upload!! ${manifest.json.mobile.js[i4]} does not exist.`);
                return false;
            }

            yield sleep(100);
            if (yield page.$("#jsFiles_MOBILE-container + .input-error-cybozu")) {
                console.warn(`Abort upload!! ${manifest.json.mobile.js[i4]}：${msg('Upload_NotPermittedFormat')}`);
				return false;
            }
        }

        /**** デスクトップ用css ****/
        console.log(`\nTrying to desktop css upload..`);
        const desktopCss = yield jsCssItem[2].$('.plupload > input[type="file"]');
        if (desktopCss == null) {
			console.log(chalk_1.default.red('input[type="file"] cannot find'));
            process.exit(1);
        }

        for (var i1 = 0, len = manifest.json.desktop.css.length; i1 < len; i1++) {
            console.log(`Trying to upload ${manifest.json.desktop.css[i1]}`);
            if (manifest.fileCheck(`${manifest.path}/${manifest.json.desktop.css[i1]}`)) {
                if (!all){ yield desktopCssItemDelete(page, manifest.json.desktop.css[i1]);}
                yield desktopCss.uploadFile(`${manifest.path}/${manifest.json.desktop.css[i1]}`);
            } else {
                console.warn(`Abort upload!! ${manifest.json.desktop.css[i1]} does not exist.`);
                return false;
            }

            yield sleep(100);
            if (yield page.$("#jsFiles_DESKTOP_CSS-container + .input-error-cybozu")) {
                console.warn(`Abort upload!! ${manifest.json.desktop.css[i1]}：${msg('Upload_NotPermittedFormat')}`);
				return false;
            }
        }

        /**** モバイル用css ****/
        console.log(`\nTrying to mobile css upload..`);
        const mobileCss = yield jsCssItem[3].$('.plupload > input[type="file"]');
        if (mobileCss == null) {
			console.log(chalk_1.default.red('input[type="file"] cannot find'));
            process.exit(1);
        }

        for (var i5 = 0, len = manifest.json.mobile.css.length; i5 < len; i5++) {
            console.log(`Trying to upload ${manifest.json.mobile.css[i5]}`);
            if (manifest.fileCheck(`${manifest.path}/${manifest.json.mobile.css[i5]}`)) {
                if (!all){ yield mobileCssItemDelete(page, manifest.json.mobile.css[i5]);}
                yield mobileCss.uploadFile(`${manifest.path}/${manifest.json.mobile.css[i5]}`);
            } else {
                console.warn(`Abort upload!! ${manifest.json.mobile.css[i5]} does not exist.`);
                return false;
            }

            yield sleep(100);
            if (yield page.$("#jsFiles_MOBILE_CSS-container + .input-error-cybozu")) {
                console.warn(`Abort upload!! ${manifest.json.mobile.css[i5]}：${msg('Upload_NotPermittedFormat')}`);
				return false;
            }
        }

        try{
            /* ボタンクリック */
            yield page.click('.button-submit-cybozu');
            yield page.waitForSelector(".notifier-success-cybozu", {
                visible: true,
                timeout: TIMEOUT_MS
            });
        }catch(e){
			throw new Error(`file uploaded error. e:${e}`);
        }

        console.log(`\n${msg("Uploaded")}`);
		return true;

    });
}

function run(domain, userName, password, manifestFile, options) {

    const { lang } = options;
    const { all } = options;
    msg = messages_1.getBoundMessage(lang);

    // マニフェストロード
    if (!manifest.load(manifestFile)) {
        console.warn(msg('Interrupt_ManifestJsonParse'));
        process.exit(1);
    }


    return __awaiter(this, void 0, void 0, function* () {
        let browser = yield launchBrowser(options.proxyServer);
        let page;
        const { lang } = options;
        try {
            page = yield readyForUpload(browser, domain, userName, password, lang);
            yield upload(page, lang, all);
            if (options.watch) {
                let uploading = false;
                fs_1.default.watch(manifest.path, { persistent: true, recursive: true }, (eventType, targetFilePath) => __awaiter(this, void 0, void 0, function* () {
                    if (uploading) {
                        return;
                    }
                    // 検知したファイルとマニフェストの内容を検証
                    if (checkNeedToSourceUpload(targetFilePath)) {
                        try {
                            uploading = true;
                            yield upload(page, lang, all);
                        } catch (e) {
                            console.log(e);
                            console.log(msg("Error_retry"));
                            yield browser.close();
                            browser = yield launchBrowser(options.proxyServer);
                            page = yield readyForUpload(browser, domain, userName, password, lang);
                            yield upload(page, lang, all);
                        } finally {
                            uploading = false;
                        }
                    }

                }));

            } else {
                yield browser.close();
                process.exit(0);
            }

        } catch (e) {
            console.error(msg("Error"), e);
            yield browser.close();
            process.exit(1);
        }
    });
}

const checkNeedToSourceUpload = (targetFilePath) => {

    if (manifest.fileName === targetFilePath) {
        if (!manifest.reload()) {
            console.warn(`${msg('Interrupt_ManifestJsonParse')}`);
            return false;
        }else{
            return true;
        }
    }

    if (manifest.json) {
        const jsonData = manifest.json;
        for (var i = 0, len = jsonData.desktop.js.length; i < len; i++) {
            if (jsonData.desktop.js[i] &&
                jsonData.desktop.js[i].pathReplace() === targetFilePath.pathReplace()) {
                return true;
            }
        }

        for (var i = 0, len = jsonData.desktop.css.length; i < len; i++) {
            if (jsonData.desktop.css[i] &&
                jsonData.desktop.css[i].pathReplace() === targetFilePath.pathReplace()) {
                return true;
            }
        }

        for (var i = 0, len = jsonData.mobile.js.length; i < len; i++) {
            if (jsonData.mobile.js[i] &&
                jsonData.mobile.js[i].pathReplace() === targetFilePath.pathReplace()) {
                return true;
            }
        }
        
        for (var i = 0, len = jsonData.mobile.css.length; i < len; i++) {
            if (jsonData.mobile.css[i] &&
                jsonData.mobile.css[i].pathReplace() === targetFilePath.pathReplace()) {
                return true;
            }
        }
    }

    return false;
};

const manifest = {
    reload: () => {
        try {
            manifest.json = null;
            if (!manifest.load(manifest.filePath)) {
                return false;
            };
            return true;
        } catch (e) {
            throw new Error(e);
        }
    },
    load: (file) => {
        var json = null;

        try {
            fs_1.default.statSync(file);
        } catch (e) {
            console.error(`${msg('Manifest_DoesNotExist')}, e:${e}`);
            process.exit(1);
        }

        try {
            json = fs_1.default.readFileSync(file, { encoding: "utf-8" });
        } catch (e) {
            console.error(`${msg('Manifest_ErrorLoading')}, e:${e}`);
            process.exit(1);
        }

        try {
            json = JSON.parse(json);
        } catch (e) {
            console.error(`${msg('Manifest_parseError')}, e:${e}`);
            return null;
        }

        // マニフェストフォーマット検査
        if (!manifest.validate(json)){
            return null;
        }

        // マニフェストをメモリに格納
        manifest.json = json;

        // マニフェストのパスを取得
        manifest.path = path.join(process.cwd(), path.dirname(file));
        manifest.fileName = path.basename(file);
        manifest.filePath = file;
        return manifest;
    },
    validate: (source) => {
        const result = new Validator().validate(source, manifest.schema);
        if (result.errors.length > 0) {
            console.error(`${msg('Manifest_FormatError')} [${result.errors[0].message}]`);
            return false;
        }
        return true;
    },
    json: null,
    path: null,
    fileName: null,
    filePath: null,
    fileCheck: function(filePath){
        try {
            fs_1.default.statSync(filePath);
            return true;
        } catch (e) {
            return false;
        }
    },
    schema: {
        description: 'validation for kintone upload manifest json',
        type: 'object',
        required: ['desktop', 'mobile'],
        maxProperties: 2,
        minProperties: 2,
        properties: {
            desktop: {
                type: 'object',
                required: ['js', 'css'],
                maxProperties: 2,
                minProperties: 2,
                properties: {
                    js: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    },
                    css: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    }
                }
            },
            mobile: {
                type: 'object',
                required: ['js', 'css'],
                maxProperties: 2,
                minProperties: 2,
                properties: {
                    js: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    },
                    css: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    }
                }
            }
        }
    }
};

String.prototype.pathReplace = function () {

    switch (os.platform()) {
        case 'win32':
            return this.replace(/\\/g, "/");
        default:
            return this.toString();
    }
}

exports.portalUpload_run = run;
