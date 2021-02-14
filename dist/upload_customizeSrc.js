// Copyright (c) 2019 Masanori Kitajima.
// Released under the MIT license
// https://github.com/k-masa2501/kintone-source-uploader/blob/master/LICENSE

"use strict";

const path = require('path');
const fs = require('fs');
const messages_1 = require("./messages");
let requestPr = require("request-promise");
const btoa = require('btoa');
const { Validator } = require('jsonschema');
const { Semaphore } = require('./semaphore');
const  os = require('os');
const mutex = { obj: new Semaphore(1, 2), release: null};
const RETRY_TIMEOUT_MSEC = 3000;
const RETRY_TIMEOUT_COUNT = 3;
//msec

String.prototype.pathReplace = function(){

    switch(os.platform()){
        case 'win32' :
            return this.replace(/\\/g, "/");
        default:
            return this.toString();
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

    // use proxy
    if (this.options.proxyServer) {
        requestPr =  requestPr.defaults(
            { 'proxy': this.options.proxyServer });
    }

    // ソースコードアップロード
    this.execUploadRun();

    // ファイル変更監視
    if (options.watch){
        let startTime = null;
        fs.watch(manifest.path, { persistent: true, recursive: true }, (eventType, targetFilePath) => {
            // 前回からの処理時間が100ミリ未満の場合、同一ファイルの変更とみなして処理しない。
            if (!startTime || 100 < (Date.now() - startTime)){
                if (eventType === 'change') {
                    ((result) => {
                        if (result) {
                            this.execUploadRun();
                        }
                    })(this.checkNeedToSourceUpload(targetFilePath));
                }
            }
            
            // 計測開始
            startTime = Date.now();
        });
    }
};

controller.prototype = {
    checkNeedToSourceUpload: function(targetFilePath) {
        if (manifest.fileName === targetFilePath){
            if (!manifest.reload()){
                logger.warn(`${msg('Interrupt_ManifestJsonParse')}`);
                return false;
            }else{
                return true;
            }
        }

        if (manifest.json) {
            let jsonData = manifest.json;
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
            
            for (var i = 0, len = jsonData.mobile.css.length; i < len; i++) {
                if (jsonData.mobile.css[i].file &&
                    jsonData.mobile.css[i].file.name.pathReplace() === targetFilePath.pathReplace()) {
                    return true;
                }
            }
        }
        return false;
    },
    execUploadRun: function () {
        return mutex.obj.acquire()
        .then(
            async release => {
        
                let jsonData = deepClone(manifest.json);

                // get mutex release
                mutex.release = release;

                if (0 !== await this.checkAppReflectionStats(jsonData)){
                    return;
                }

                if (0 !== await this.upload_DesktopJs(jsonData)){
                    return;
                }

                if (0 !== await this.upload_DesktopCss(jsonData)){
                    return;
                }

                if (0 !== await this.upload_MobileJs(jsonData)){
                    return;
                }

                if (0 !== await this.upload_MobileCss(jsonData)){
                    return;
                }

                if (0 !== await this.chageAppSettings(jsonData)){
                    return;
                }

                await this.deploy(jsonData);

                return;
            }
        )
        .catch(e => console.warn(`warn: ${e.message}`));
    },
    checkAppReflectionStats: async function (jsonData, timeout = RETRY_TIMEOUT_COUNT) {

        let options = {
                uri: this.kintoneUrl("/k/v1/preview/app/deploy"),
                headers: {
                    "X-Cybozu-Authorization": Base64.encode(`${this.username}:${this.password}`),
                    "Content-Type": "application/json"
                },
                body: { "apps": [jsonData.app] },
                resolveWithFullResponse: true,
                json: true
            };

        // HTTP GET
        return requestPr.get(options).then(response => {
            
            let body = response.body,
                errMsg = null,
                item = null;

            if (response.statusCode === 200) {
                item = body.apps.find(item => String(item.app) === String(jsonData.app));
                if (item && item.status === "PROCESSING") {
                    if (0 < timeout){
                        logger.warn(`${msg('kintoneStatus_processing')} retry:${timeout}`);
                        return new Promise((res,rej) =>{
                            setTimeout(() => { 
                                res(this.checkAppReflectionStats(jsonData, --timeout)); 
                            }, RETRY_TIMEOUT_MSEC);
                        });
                    }else{
                        // リトライタイムアウト。リトライ処理を終了します。
                        logger.error(`${msg('retry_Timeout')}  retry:${timeout}`);
                        return -1;
                    }
                } 
                return 0;

            } else {
                    errMsg = `error: ${consoleJson(error)}\n`;
                    errMsg += `body: ${consoleJson(body)}\n`;
                    errMsg += msg('get_kintoneStatusError');
                    logger.error(errMsg);
                    return -1;
            }
        }).catch(e => {
            console.error(e);
            return -1;
        });

    },
    upload_DesktopJs: function (jsonData = null, elmCounter = 0, timeout = RETRY_TIMEOUT_COUNT) {

        let options = null,
            errMsg = null;

        if (jsonData.desktop.js[elmCounter] &&
            jsonData.desktop.js[elmCounter].type === "FILE" &&
            jsonData.desktop.js[elmCounter].file &&
            jsonData.desktop.js[elmCounter].file.fileKey == null) {

            options = { 
                url: this.kintoneUrl("/k/v1/file"),
                headers: {
                    "X-Cybozu-Authorization": Base64.encode(`${this.username}:${this.password}`)
                },
                formData: createFormData(jsonData.desktop.js[elmCounter].file.name),
                resolveWithFullResponse: true,
                json: true
            };

            if (options.formData) {
                return requestPr.post(options).then((response) => {
                    if (response.statusCode === 200) {
                        logger.info(`${msg('Manifest_fileUploadSuccess')}  file: ${jsonData.desktop.js[elmCounter].file.name}`);
                        jsonData.desktop.js[elmCounter].file.fileKey = response.body.fileKey;
                        return this.upload_DesktopJs(jsonData, ++elmCounter);
                    } else {
                        if (0 < timeout) {
                            errMsg = `errorNode: ${consoleJson(jsonData.desktop.js[elmCounter])}\n`;
                            errMsg += `error: ${consoleJson(error)}\n`;
                            errMsg += `body: ${consoleJson(body)}\n`;
                            errMsg += `${msg('Manifest_fileUploadError')} retry:${timeout}`;
                            logger.warn(`${errMsg}`);
                            return new Promise((res,rej) =>{
                                setTimeout(() => { 
                                    res(this.upload_DesktopJs(jsonData, elmCounter, --timeout)); 
                                }, RETRY_TIMEOUT_MSEC);
                            });
                        } else {
                            // リトライタイムアウト。リトライ処理を終了します。
                            logger.error(`${msg('retry_Timeout')}  retry:${timeout}`);
                            return -1;
                        }
                    }
                }).catch(e => {
                    console.error(e);
                    return -1;
                });

            }else{
                logger.error(msg('targetfile_NotRead'));
                return -1;
            }
        } else if (jsonData.desktop.js[++elmCounter]) {
            return this.upload_DesktopJs(jsonData, elmCounter);
        }

        return 0;
    },
    upload_DesktopCss: function (jsonData, elmCounter = 0, timeout = RETRY_TIMEOUT_COUNT) {

        let options = null,
            errMsg = null;

        if (jsonData.desktop.css[elmCounter] &&
            jsonData.desktop.css[elmCounter].type === "FILE" &&
            jsonData.desktop.css[elmCounter].file &&
            jsonData.desktop.css[elmCounter].file.fileKey == null) {

            options = {
                url: this.kintoneUrl("/k/v1/file"),
                headers: {
                    "X-Cybozu-Authorization": Base64.encode(`${this.username}:${this.password}`)
                },
                formData: createFormData(jsonData.desktop.css[elmCounter].file.name),
                resolveWithFullResponse: true,
                json: true
            };

            if (options.formData) {
                return requestPr.post(options).then(response => {
                    if (response.statusCode === 200) {
                        logger.info(`${msg('Manifest_fileUploadSuccess')}  file: ${jsonData.desktop.css[elmCounter].file.name}`);
                        jsonData.desktop.css[elmCounter].file.fileKey = response.body.fileKey;
                        return this.upload_DesktopCss(jsonData, ++elmCounter);
                    } else {
                        if (0 < timeout) {
                            errMsg = `error: ${consoleJson(error)}\n`;
                            errMsg += `body: ${consoleJson(body)}\n`;
                            errMsg += `errorNode: ${consoleJson(jsonData.desktop.js[elmCounter])}\n`;
                            errMsg += `${msg('Manifest_fileUploadError')} retry:${timeout}`;
                            logger.warn(errMsg);
                            return new Promise((res,rej) =>{
                                setTimeout(() => { 
                                    res(this.upload_DesktopCss(jsonData, elmCounter, --timeout)); 
                                }, RETRY_TIMEOUT_MSEC);
                            });
                        } else {
                            // リトライタイムアウト。リトライ処理を終了します。
                            logger.error(`${msg('retry_Timeout')}  retry:${timeout}`);
                            return -1;
                        }
                    }
                }).catch(e => {
                    console.error(e);
                    return -1;
                });
            } else {
                logger.error(msg('targetfile_NotRead'));
                return -1;
            }

        } else if (jsonData.desktop.css[++elmCounter]) {
            return this.upload_DesktopCss(jsonData, elmCounter);
        }

        return 0;
    },
    upload_MobileJs: function (jsonData, elmCounter = 0, timeout = RETRY_TIMEOUT_COUNT) {

        let options = null,
            errMsg = null;

        if (jsonData.mobile.js[elmCounter] &&
            jsonData.mobile.js[elmCounter].type === "FILE" &&
            jsonData.mobile.js[elmCounter].file &&
            jsonData.mobile.js[elmCounter].file.fileKey == null) {

            options = {
                url: this.kintoneUrl("/k/v1/file"),
                headers: {
                    "X-Cybozu-Authorization": Base64.encode(`${this.username}:${this.password}`)
                },
                formData: createFormData(jsonData.mobile.js[elmCounter].file.name),
                resolveWithFullResponse: true,
                json: true
            };

            if (options.formData) {
                return requestPr.post(options).then(response => {
                    if (response.statusCode === 200) {
                        logger.info(`${msg('Manifest_fileUploadSuccess')}  file: ${jsonData.mobile.js[elmCounter].file.name}`);
                        jsonData.mobile.js[elmCounter].file.fileKey = response.body.fileKey;
                        return this.upload_MobileJs(jsonData, ++elmCounter);
                    } else {
                        if (0 < timeout) {
                            errMsg = `errorNode: ${consoleJson(jsonData.mobile.js[elmCounter])}\n`;
                            errMsg += `error: ${consoleJson(error)}\n`;
                            errMsg += `body: ${consoleJson(body)}\n`;
                            errMsg += `${msg('Manifest_fileUploadError')} retry:${timeout}`;
                            logger.warn(errMsg);
                            return new Promise((res,rej) =>{
                                setTimeout(() => { 
                                    res(this.upload_MobileJs(jsonData, elmCounter, --timeout)); 
                                }, RETRY_TIMEOUT_MSEC);
                            });
                        } else {
                            // リトライタイムアウト。リトライ処理を終了します。
                            logger.error(`${msg('retry_Timeout')}  retry:${timeout}`);
                            return -1;
                        }
                    }
                }).catch(e => {
                    console.error(e);
                    return -1;
                });
            } else {
                logger.error(msg('targetfile_NotRead'));
                return -1;
            }

        } else if (jsonData.mobile.js[++elmCounter]) {
            return this.upload_MobileJs(jsonData, elmCounter);
        }

        return 0;
    },
    upload_MobileCss: function (jsonData, elmCounter = 0, timeout = RETRY_TIMEOUT_COUNT) {

        let options = null,
            errMsg = null;

        if (jsonData.mobile.css[elmCounter] &&
            jsonData.mobile.css[elmCounter].type === "FILE" &&
            jsonData.mobile.css[elmCounter].file &&
            jsonData.mobile.css[elmCounter].file.fileKey == null) {

            options = {
                url: this.kintoneUrl("/k/v1/file"),
                headers: {
                    "X-Cybozu-Authorization": Base64.encode(`${this.username}:${this.password}`)
                },
                formData: createFormData(jsonData.mobile.css[elmCounter].file.name),
                resolveWithFullResponse: true,
                json: true
            };

            if (options.formData) {
                return requestPr.post(options).then(response => {
                    if (response.statusCode === 200) {
                        logger.info(`${msg('Manifest_fileUploadSuccess')}  file: ${jsonData.mobile.css[elmCounter].file.name}`);
                        jsonData.mobile.css[elmCounter].file.fileKey = response.body.fileKey;
                        return this.upload_MobileCss(jsonData, ++elmCounter);
                    } else {
                        if (0 < timeout) {
                            errMsg = `errorNode: ${consoleJson(jsonData.mobile.css[elmCounter])}\n`;
                            errMsg += `error: ${consoleJson(error)}\n`;
                            errMsg += `body: ${consoleJson(body)}\n`;
                            errMsg += `${msg('Manifest_fileUploadError')} retry:${timeout}`;
                            logger.warn(errMsg);
                            return new Promise((res,rej) =>{
                                setTimeout(() => { 
                                    res(this.upload_MobileCss(jsonData, elmCounter, --timeout)); 
                                }, RETRY_TIMEOUT_MSEC);
                            });
                        } else {
                            // リトライタイムアウト。リトライ処理を終了します。
                            logger.error(`${msg('retry_Timeout')}  retry:${timeout}`);
                            return -1;
                        }
                    }
                }).catch(e => {
                    console.error(e);
                    return -1;
                });
            } else {
                logger.error(msg('targetfile_NotRead'));
                return -1;
            }

        } else if (jsonData.mobile.css[++elmCounter]) {
            return this.upload_MobileCss(jsonData, elmCounter);
        }

        return 0;
    },
    chageAppSettings: function (jsonData, timeout = RETRY_TIMEOUT_COUNT) {

        // 変更反映前、ログ出力
        logger.info(msg('before_AppSettingChange'));
        logger.info(consoleJson(jsonData));

        let sendData = deleteJsonKey(deepClone(jsonData)),
            options = {
                url: this.kintoneUrl("/k/v1/preview/app/customize"),
                headers: {
                    "X-Cybozu-Authorization": Base64.encode(`${this.username}:${this.password}`),
                    "Content-Type": "application/json"
                },
                body: sendData,
                resolveWithFullResponse: true,
                json: true
            },
            errMsg = null;

        return requestPr.put(options).then(response => {
            if (response.statusCode === 200) {
                // 変更反映後、ログ出力
                logger.info(msg('success_AppSettingChange'));
                return 0;
            } else {
                if (0 < timeout) {
                    errMsg = `body: ${consoleJson(response.body)}\n`;
                    errMsg += `${msg('change_AppSettingsError')} retry:${timeout}`;
                    logger.warn(errMsg);
                    return new Promise((res,rej) =>{
                        setTimeout(() => { 
                            res(this.chageAppSettings(jsonData, --timeout)); 
                        }, RETRY_TIMEOUT_MSEC);
                    });
                } else {
                    // リトライタイムアウト。リトライ処理を終了します。
                    logger.error(`${msg('retry_Timeout')}  retry:${timeout}`);
                    return -1;
                }
            }
        }).catch(e => {
            console.error(e);
            return -1;
        });
    },
    deploy: function (jsonData, timeout = RETRY_TIMEOUT_COUNT) {

        // 変更反映前、ログ出力
        logger.info(msg('before_AppDeploy'));

        let options = {
                url: this.kintoneUrl("/k/v1/preview/app/deploy"),
                headers: {
                    "X-Cybozu-Authorization": Base64.encode(`${this.username}:${this.password}`),
                    "Content-Type": "application/json"
                },
                body: {
                    "apps": [{ "app": jsonData.app }]
                },
                resolveWithFullResponse: true,
                json: true
            },
            errMsg = null;

        return requestPr.post(options).then(response => {
            if (response.statusCode === 200) {
                // 変更反映後、ログ出力
                logger.info(msg('success_AppDeploy'));
                if (mutex.release) mutex.release();
                return 0;
            } else {
                if (0 < timeout) {
                    errMsg = `body: ${consoleJson(response.body)}\n`;
                    errMsg += `${msg('deploy_Error')} retry:${timeout}\n`;
                    logger.warn(errMsg);
                    return new Promise((res,rej) =>{
                        setTimeout(() => { 
                            res(this.deploy(jsonData, --timeout)); 
                        }, RETRY_TIMEOUT_MSEC);
                    });
                } else {
                    // リトライタイムアウト。リトライ処理を終了します。
                    logger.error(`${msg('retry_Timeout')}  retry:${timeout}`);
                    return -1;
                }
            }
        });
    },
    kintoneUrl: function(_url) {

        const url = _url.replace(".json", "");

        if (manifest.json.guest_space_id && parseInt(manifest.json.guest_space_id, 10) > 0) {
            return `https://${this.domain}/k/guest/${manifest.json.guest_space_id}${url.replace("/k", "")}.json`;
        }
        return `https://${this.domain}${url}.json`;

    },
	getMutex: function(){
		return mutex;
	},
};

const deleteJsonKey = function (jsonData) {
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
    for (var i = 0, len = jsonData.mobile.css.length; i < len; i++) {
        if (jsonData.mobile.css[i].file) {
            delete jsonData.mobile.css[i].file.contentType;
            delete jsonData.mobile.css[i].file.name;
            delete jsonData.mobile.css[i].file.size;
        }
    }
    return jsonData;
}

const createFormData = function(filePath){

    const target = path.join(manifest.path, filePath);
    var stream = null;

    try {
        fs.statSync(target);
        stream = fs.createReadStream(target);
        return {
            name: path.basename(filePath),
            file: {
                value: stream,
                options: {
                    filename: path.basename(filePath),
                    contentType: 'text/plain'
                }
            }
        }
    } catch (e) {
        logger.warn(`${msg('targetSrc_ReadError')}, e:${e}`);
        return null;
    }
}

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

const consoleJson = function(msg){
    return JSON.stringify(msg, function (key, val) {
        if (typeof val === "function") {
            return val.toString();
        }
        return val;
    }, ' ');
}

var msg = null;
const run = (domain, username, password, manifestFile, options) => {
    const { lang } = options;
    msg = messages_1.getBoundMessage(lang);
    return new controller(domain, username, password, manifestFile, options);
};

module.exports.customizeUpload_run = run;
