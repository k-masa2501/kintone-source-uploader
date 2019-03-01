// Copyright (c) 2019 Masanori Kitajima.
// Released under the MIT license
// https://github.com/k-masa2501/kintone-source-uploader/blob/master/LICENSE

"use strict";

const path = require('path');
const fs = require('fs');
const messages_1 = require("./messages");
const request = require("request");
const formData = require('form-data');
const util = require("util");
const btoa = require('btoa');
const { Validator } = require('jsonschema');
const { Mutex } = require('await-semaphore');
const  os = require('os');
const mutex = { obj: new Mutex(), release: null};
const RETRY_TIMEOUT_MSEC = 3000;
const RETRY_TIMEOUT_COUNT = 3;
//msec

String.prototype.pathReplace = function(){

    switch(os.platform()){
        case 'win32' :
            return this.replace(/\\/g, "/");
    }
}

const controller = function(domain, username, password, manifestFile, options) {
    this.domain = domain;
    this.username = username;
    this.password = password;
    this.options = options;

    // マニフェストロード
    if (!manifest.load(manifestFile)) {
        logger.warn(`${msg('Interrupt_ManifestJsonParse')}`);
        process.exit(1);
    }

    // ソースコードアップロード
    this.rapper_execRun();

    // ファイル変更監視
    if (options.watch){
        this.fsWatch();
    }
};

controller.prototype = {
	getMutex: function(){
		return mutex;
	},
    fsWatch: function(){
        var startTime = null;
        fs.watch(manifest.path, { persistent: true, recursive: true }, (eventType, targetFilePath) => {
            // 前回からの処理時間が100ミリ未満の場合、同一ファイルの変更とみなして処理しない。
            if (!startTime || 100 < (Date.now() - startTime)){
                if (eventType === 'change') {
                    ((result) => {
                        if (result) {
                            this.rapper_execRun();
                        }
                    })(this.checkIfNeedToUpload(targetFilePath));
                }
            }
            
            // 計測開始
            startTime = Date.now();
        });
    },
    checkIfNeedToUpload: function(targetFilePath) {
        console.log(targetFilePath);
        console.log(manifest.fileName);
        console.log(manifest.json);
        if (manifest.fileName === targetFilePath){
            if (!manifest.reload()){
                logger.warn(`${msg('Interrupt_ManifestJsonParse')}`);
                return false;
            }else{
                return true;
            }
        }

        if (manifest.json) {
            const jsonData = manifest.json;
            for (var i = 0, len = jsonData.desktop.js.length; i < len; i++) {
                if (jsonData.desktop.js[i].file &&
                    jsonData.desktop.js[i].file.name.pathReplace() === targetFilePath.pathReplace()) {
                    return true;
                }
            }

            for (var i = 0, len = jsonData.desktop.css.length; i < len; i++) {
                if (jsonData.desktop.css[i].file &&
                    jsonData.desktop.css[i].file.name.pathReplace() === targetFilePath.pathReplace()) {
                    return true;
                }
            }

            for (var i = 0, len = jsonData.mobile.js.length; i < len; i++) {
                if (jsonData.mobile.js[i].file &&
                    jsonData.mobile.js[i].file.name.pathReplace() === targetFilePath.pathReplace()) {
                    return true;
                }
            }
        }

        return false;
    },
    rapper_execRun: async function () {
        try{
            mutex.release = await mutex.obj.acquire();
            this.execRun();
        }catch(e){
            if (mutex.release) mutex.release();
        }
    },
    execRun: function (timeout = RETRY_TIMEOUT_COUNT) {

        const jsonData = deepClone(manifest.json);
        try {
            const request = this.requestWithProxy();
            const options = {
                url: this.kintoneUrl("/k/v1/preview/app/deploy"),
                headers: {
                    "Host": `${this.domain}:443`,
                    "X-Cybozu-Authorization": Base64.encode(`${this.username}:${this.password}`),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ "apps": [jsonData.app] })
            };

            request.get(options,  (error, response, body) => {
                if (!error && (response.statusCode === 200)) {
                    body = JSON.parse(body);
                    const item = body.apps.find(item => String(item.app) === String(jsonData.app));
                    if (item && item.status !== "PROCESSING") {
                        this.upload_DesktopJs(jsonData);
                    } else {
                        if (0 < timeout){
                            logger.warn(`${msg('kintoneStatus_processing')} retry:${timeout}`);
                            setTimeout(() => { this.execRun(--timeout); }, RETRY_TIMEOUT_MSEC);
                        }else{
                            // リトライタイムアウト。リトライ処理を終了します。
                            logger.error(`${msg('retry_Timeout')}  retry:${timeout}`);
                            return;
                        }
                    }
                } else {
                    if (0 < timeout) {
                        var errMsg = `error: ${util.inspect(error, { depth: null })}\n`;
                        errMsg += `body: ${util.inspect(body, { depth: null })}\n`;
                        errMsg += `${msg('get_kintoneStatusError')} retry:${timeout}`;
                        logger.warn(errMsg);
                        setTimeout( () => { this.execRun(--timeout); }, RETRY_TIMEOUT_MSEC);
                    } else {
                        // リトライタイムアウト。リトライ処理を終了します。
                        logger.error(`${msg('retry_Timeout')}  retry:${timeout}`);
                        return;
                    }
                }
            });
        } catch (error) {
            logger.error(error);
        }
    },
    upload_DesktopJs: function (jsonData = null, elmCounter = 0, timeout = RETRY_TIMEOUT_COUNT) {

        try {

            if (jsonData.desktop.js[elmCounter] &&
                jsonData.desktop.js[elmCounter].type === "FILE" &&
                jsonData.desktop.js[elmCounter].file &&
                jsonData.desktop.js[elmCounter].file.fileKey == null) {

                const request = this.requestWithProxy();
                const options = { url: this.kintoneUrl("/k/v1/file") };
                const formData = this.createFormData(jsonData.desktop.js[elmCounter].file.name);

                if (formData) {
                    const r = request.post(options, (error, response, body) => {
                        if (!error && (response.statusCode === 200)) {
                            logger.info(`${msg('Manifest_fileUploadSuccess')}  file: ${jsonData.desktop.js[elmCounter].file.name}`);
                            jsonData.desktop.js[elmCounter].file.fileKey = JSON.parse(response.body).fileKey;
                            this.upload_DesktopJs(jsonData, ++elmCounter);
                        } else {
                            if (0 < timeout) {
                                var errMsg = `errorNode: ${util.inspect(jsonData.desktop.js[elmCounter], { depth: null })}\n`;
                                errMsg += `error: ${util.inspect(error, { depth: null })}\n`;
                                errMsg += `body: ${util.inspect(body, { depth: null })}\n`;
                                errMsg += `${msg('Manifest_fileUploadError')} retry:${timeout}`;
                                logger.warn(`${errMsg}`);
                                setTimeout(() => { this.upload_DesktopJs(jsonData, elmCounter, --timeout); }, RETRY_TIMEOUT_MSEC);
                            } else {
                                // リトライタイムアウト。リトライ処理を終了します。
                                logger.error(`${msg('retry_Timeout')}  retry:${timeout}`);
                                return;
                            }
                        }
                    });
                    r._form = formData;
                    r.setHeader("Host", `${this.domain}:443`);
                    r.setHeader("X-Cybozu-Authorization", Base64.encode(`${this.username}:${this.password}`));
                }else{
                    logger.error(msg('targetfile_NotRead'));
                    return;
                }
            } else if (jsonData.desktop.js[++elmCounter]) {
                this.upload_DesktopJs(jsonData, elmCounter);
            } else {
                this.upload_DesktopCss(jsonData);
            }
        } catch (error) {
            logger.error(error);
        }

    },
    upload_DesktopCss: function (jsonData, elmCounter = 0, timeout = RETRY_TIMEOUT_COUNT) {

        try {
            if (jsonData.desktop.css[elmCounter] &&
                jsonData.desktop.css[elmCounter].type === "FILE" &&
                jsonData.desktop.css[elmCounter].file &&
                jsonData.desktop.css[elmCounter].file.fileKey == null) {

                const request = this.requestWithProxy();
                const options = { url: this.kintoneUrl("/k/v1/file") };
                const formData = this.createFormData(jsonData.desktop.css[elmCounter].file.name);

                if (formData) {
                    const r = request.post(options, (error, response, body) => {
                        if (!error && (response.statusCode === 200)) {
                            logger.info(`${msg('Manifest_fileUploadSuccess')}  file: ${jsonData.desktop.css[elmCounter].file.name}`);
                            jsonData.desktop.css[elmCounter].file.fileKey = JSON.parse(response.body).fileKey;
                            this.upload_DesktopCss(jsonData, ++elmCounter);
                        } else {
                            if (0 < timeout) {
                                var errMsg = `error: ${util.inspect(error, { depth: null })}\n`;
                                errMsg += `body: ${util.inspect(body, { depth: null })}\n`;
                                errMsg += `errorNode: ${util.inspect(jsonData.desktop.js[elmCounter], { depth: null })}\n`;
                                errMsg += `${msg('Manifest_fileUploadError')} retry:${timeout}`;
                                logger.warn(errMsg);
                                setTimeout(() => { this.upload_DesktopCss(jsonData, elmCounter, --timeout); }, RETRY_TIMEOUT_MSEC);
                            } else {
                                // リトライタイムアウト。リトライ処理を終了します。
                                logger.error(`${msg('retry_Timeout')}  retry:${timeout}`);
                                return;
                            }
                        }
                    });
                    r._form = formData;
                    r.setHeader("Host", `${this.domain}:443`);
                    r.setHeader("X-Cybozu-Authorization", Base64.encode(`${this.username}:${this.password}`));
                } else {
                    logger.error(msg('targetfile_NotRead'));
                    return;
                }

            } else if (jsonData.desktop.css[++elmCounter]) {
                this.upload_DesktopCss(jsonData, elmCounter);
            } else {
                this.upload_MobileJs(jsonData);
            }

        } catch (error) {
            logger.error(error);
        }
    },
    upload_MobileJs: function (jsonData, elmCounter = 0, timeout = RETRY_TIMEOUT_COUNT) {

        try {
            if (jsonData.mobile.js[elmCounter] &&
                jsonData.mobile.js[elmCounter].type === "FILE" &&
                jsonData.mobile.js[elmCounter].file &&
                jsonData.mobile.js[elmCounter].file.fileKey == null) {

                const request = this.requestWithProxy();
                const options = { url: this.kintoneUrl("/k/v1/file") };
                const formData = this.createFormData(jsonData.mobile.js[elmCounter].file.name);

                if (formData) {
                    const r = request.post(options, (error, response, body) => {
                        if (!error && (response.statusCode === 200)) {
                            logger.info(`${msg('Manifest_fileUploadSuccess')}  file: ${jsonData.mobile.js[elmCounter].file.name}`);
                            jsonData.mobile.js[elmCounter].file.fileKey = JSON.parse(response.body).fileKey;
                            this.upload_MobileJs(jsonData, ++elmCounter);
                        } else {
                            if (0 < timeout) {
                                var errMsg = `errorNode: ${util.inspect(jsonData.mobile.js[elmCounter], { depth: null })}\n`;
                                errMsg += `error: ${util.inspect(error, { depth: null })}\n`;
                                errMsg += `body: ${util.inspect(body, { depth: null })}\n`;
                                errMsg += `${msg('Manifest_fileUploadError')} retry:${timeout}`;
                                logger.warn(errMsg);
                                setTimeout(() => { this.upload_MobileJs(jsonData, elmCounter, --timeout); }, RETRY_TIMEOUT_MSEC);
                            } else {
                                // リトライタイムアウト。リトライ処理を終了します。
                                logger.error(`${msg('retry_Timeout')}  retry:${timeout}`);
                                return;
                            }
                        }
                    });
                    r._form = formData;
                    r.setHeader("Host", `${this.domain}:443`);
                    r.setHeader("X-Cybozu-Authorization", Base64.encode(`${this.username}:${this.password}`));
                } else {
                    logger.error(msg('targetfile_NotRead'));
                    return;
                }

            } else if (jsonData.mobile.js[++elmCounter]) {
                this.upload_MobileJs(jsonData, elmCounter);
            } else {
                this.chageAppSettings(jsonData);
            }
        } catch (error) {
            logger.error(error);
        }
    },
    chageAppSettings: function (jsonData, timeout = RETRY_TIMEOUT_COUNT) {

        try {
            // 変更反映前、ログ出力
            logger.info(msg('before_AppSettingChange'));
            logger.info(util.inspect(jsonData, { depth: null }));

            const sendData = this.deleteJsonKey(deepClone(jsonData));

            const request = this.requestWithProxy();
            const options = {
                url: this.kintoneUrl("/k/v1/preview/app/customize"),
                headers: {
                    "Host": `${this.domain}:443`,
                    "X-Cybozu-Authorization": Base64.encode(`${this.username}:${this.password}`),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(sendData)
            };

            request.put(options, (error, response, body) => {
                if (!error && (response.statusCode === 200)) {
                    // 変更反映後、ログ出力
                    logger.info(msg('success_AppSettingChange'));
                    this.deploy(jsonData);
                } else {
                    if (0 < timeout) {
                        var errMsg = `error: ${util.inspect(error, { depth: null })}\n`;
                        errMsg += `body: ${util.inspect(body, { depth: null })}\n`;
                        errMsg += `${msg('change_AppSettingsError')} retry:${timeout}`;
                        logger.warn(errMsg);
                        setTimeout(() => { this.chageAppSettings(jsonData, --timeout); }, RETRY_TIMEOUT_MSEC);
                    } else {
                        // リトライタイムアウト。リトライ処理を終了します。
                        logger.error(`${msg('retry_Timeout')}  retry:${timeout}`);
                        return;
                    }
                }
            });
        } catch (error) {
            logger.error(error);
        }
    },
    deploy: function (jsonData, timeout = RETRY_TIMEOUT_COUNT) {

        try {
            // 変更反映前、ログ出力
            logger.info(msg('before_AppDeploy'));

            const request = this.requestWithProxy();
            const options = {
                url: this.kintoneUrl("/k/v1/preview/app/deploy"),
                headers: {
                    "Host": `${this.domain}:443`,
                    "X-Cybozu-Authorization": Base64.encode(`${this.username}:${this.password}`),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "apps": [{ "app": jsonData.app }]
                })
            };

            request.post(options, (error, response, body) => {
                if (!error && (response.statusCode === 200)) {
                    // 変更反映後、ログ出力
                    logger.info(msg('success_AppDeploy'));
                    if (mutex.release) mutex.release();

                } else {
                    if (0 < timeout) {
                        var errMsg = `error: ${util.inspect(error, { depth: null })}\n`;
                        errMsg += `body: ${util.inspect(body, { depth: null })}\n`;
                        errMsg += `${msg('deploy_Error')} retry:${timeout}\n`;
                        logger.warn(errMsg);
                        setTimeout(() => { this.deploy(jsonData, --timeout); }, RETRY_TIMEOUT_MSEC);
                    } else {
                        // リトライタイムアウト。リトライ処理を終了します。
                        logger.error(`${msg('retry_Timeout')}  retry:${timeout}`);
                        return;
                    }
                }
            });
        } catch (error) {
            logger.error(error);
        }
    },
    deleteJsonKey: function(jsonData) { //
        delete jsonData.guest_space_id;
        delete jsonData.revision;
        for (var i = 0, len = jsonData.desktop.js.length; i < len; i++) {
            if (jsonData.desktop.js[i].file) {
                delete jsonData.desktop.js[i].file.contentType;
                delete jsonData.desktop.js[i].file.name;
                delete jsonData.desktop.js[i].file.size;
            }
        }
        for (var i = 0, len = jsonData.desktop.css.length; i < len; i++) {
            if (jsonData.desktop.css[i].file) {
                delete jsonData.desktop.css[i].file.contentType;
                delete jsonData.desktop.css[i].file.name;
                delete jsonData.desktop.css[i].file.size;
            }
        }
        for (var i = 0, len = jsonData.mobile.js.length; i < len; i++) {
            if (jsonData.mobile.js[i].file) {
                delete jsonData.mobile.js[i].file.contentType;
                delete jsonData.mobile.js[i].file.name;
                delete jsonData.mobile.js[i].file.size;
            }
        }
        return jsonData;
    },
    kintoneUrl: function(_url) {

        const url = _url.replace(".json", "");

        if (manifest.json.guest_space_id && Number(manifest.json.guest_space_id) > 0) {
            return `https://${this.domain}/k/guest/${manifest.json.guest_space_id}${url.replace("/k", "")}.json`;
        }
        return `https://${this.domain}${url}.json`;

    },
    requestWithProxy: function() {
        if (this.options.proxyServer) {
            return request.defaults(
                { 'proxy': this.options.proxyServer });
        }
        return request;

    },
    createFormData: function(filePath) {
        const target = path.join(manifest.path, filePath);
        const form = new formData();

        try {
            fs.statSync(target);
            form.append('file', fs.createReadStream(target), path.basename(filePath));
            return form;
        } catch (e) {
            logger.warn(`${msg('targetSrc_ReadError')}, e:${e}`);
            return null;
        }
    }
};

const logger = {
    error: (msg) => {
        console.error(msg);
        if (mutex.release) mutex.release();
    },
    info: (msg) => {
        console.info(msg);
    },
    warn: (msg) => {
        console.warn(msg);
    }
}

const manifest = {
    reload: () => {
        try{
            manifest.json = null;
            if (!manifest.load(manifest.filePath)){
                return false;
            };
            return true;
        }catch(e){
            logger.error(e);
            process.exit(1);
        }
    },
    load: (file) => {
        var json = null;

        try {
            fs.statSync(file);
        } catch (e) {
            logger.error(`${msg('Manifest_DoesNotExist')}, e:${e}`);
            process.exit(1);
        }

        try {
            json = fs.readFileSync(file, { encoding: "utf-8" });
        } catch (e) {
            logger.error(`${msg('Manifest_ErrorLoading')}, e:${e}`);
            process.exit(1);
        }

        try {
            json = JSON.parse(json);
        } catch (e) {
            logger.error(`${msg('Manifest_parseError')}, e:${e}`);
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
            logger.error(`${msg('Manifest_FormatError')} [${result.errors[0].message}]`);
            return false;
        }
        return true;
    },
    json: null,
    path: null,
    fileName: null,
    filePath: null,
    schema: {
        description: 'validation for kintone upload manifest json',
        type: 'object',
        required: ['app', 'scope', 'desktop', 'mobile'],
        maxProperties: 5,
        minProperties: 4,
        properties: {
            app: { type: 'integer' },
            guest_space_id: { type: 'integer' },
            scope: { type: 'string', pattern: '(ALL)|(ADMIN)|(NONE)' },
            desktop: {
                type: 'object',
                required: ['js', 'css'],
                maxProperties: 2,
                minProperties: 2,
                properties: {
                    js: {
                        type: "array",
                        items: {
                            type: "object"
                        }
                    },
                    css: {
                        type: "array",
                        items: {
                            type: "object"
                        }
                    }
                }
            },
            mobile: {
                type: 'object',
                required: ['js'],
                maxProperties: 1,
                minProperties: 1,
                properties: {
                    js: {
                        type: "array",
                        items: {
                            type: "object"
                        }
                    }
                }
            }
        }
    }
};

const deepClone = (object) => {
    var node;
    var copyobj = {};
    var copyary = [];
    if (object === null) {
        node = null;
    } else if (Array.isArray(object)) {
        node = object.slice(0, object.length) || [];
        for (var i = 0, len = node.length; i < len; i++) {
            if (typeof node[i] === 'object' && node[i] !== {} || Array.isArray(n)) {
                copyary.push(deepClone(node[i]));
            } else {
                copyary.push(node[i]);
            }
        }
        return copyary;
    } else if (typeof object === 'object') {
        node = Object.assign({}, object);
        Object.keys(node).forEach(key => {
            if (typeof node[key] === 'object' && node[key] !== {}) {
                copyobj[key] = deepClone(node[key]);
            } else {
                copyobj[key] = node[key];
            }
        });
        return copyobj;
    } else {
        node = object;
    }
    return node;
};

const Base64 = {
    encode: (str) => {
        return btoa(unescape(encodeURIComponent(str)));
    }
};

var msg = null;
const run = (domain, username, password, manifestFile, options) => {
    const { lang } = options;
    msg = messages_1.getBoundMessage(lang);
    return new controller(domain, username, password, manifestFile, options);
};

module.exports.srcUpload_run = run;
