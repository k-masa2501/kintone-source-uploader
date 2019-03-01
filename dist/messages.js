// Copyright (c) 2018 Cybozu, Inc.
// Released under the MIT license
// https://github.com/kintone/plugin-uploader/blob/master/LICENSE

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const messages = {
    Q_Domain: {
        en: "Input your Kintone subdomain (example.cybozu.com):",
        ja: "kintoneのドメインを入力してください (example.cybozu.com):"
    },
    Q_UserName: {
        en: "Input your username:",
        ja: "ログイン名を入力してください:"
    },
    Q_Password: {
        en: "Input your password:",
        ja: "パスワードを入力してください:"
    },
    Error: {
        en: "An error occured",
        ja: "エラーが発生しました"
    },
    Error_retry: {
        en: "An error occured, retry with a new browser",
        ja: "エラーが発生しました。リトライします"
    },
    Error_requiredZipPath: {
        en: "Please specify the path of the Kintone plug-in zip file",
        ja: "kintoneプラグインのzipへのパスを指定してください"
    },
    Error_failedLogin: {
        en: "Error: Login failed, please confirm your username and password",
        ja: "エラー: kintoneへのログインに失敗しました。ログイン名とパスワードを確認してください"
    },
    Error_cannotOpenLogin: {
        en: "Error: Cannot find a login form on the specified page, please confirm the subdomain",
        ja: "エラー: 指定されたページにログインフォームが見つかりませんでした。ドメインを確認してください"
    },
    Error_adminPrivilege: {
        en: "Error: Cannot navigate to the plug-ins page, please retry with an account with administrator privileges",
        ja: "エラー: kintone管理者権限のあるユーザーで実行してください"
    },
    Uploaded: {
        en: "has been uploaded!",
        ja: "アップロードしました!"
    },
    Error_requiredType: {
        en: "Please specify the path to the process type.",
        ja: "処理の種別を指定してください。"
    },
    Manifest_DoesNotSpecify: {
        en: "Manifest file does not specify.",
        ja: "マニフェストファイルが引数より指定されていません。"
    },
    Manifest_DoesNotExist: {
        en: "Manifest file does not exist.",
        ja: "マニフェストファイルが存在しません。"
    },
    Manifest_ErrorLoading: {
        en: "Reading manifest file failed.",
        ja: "マニフェストファイルの読み込みに失敗しました。"
    },
    Manifest_parseError: {
        en: "Could not parse the manifest file into Json format.",
        ja: "マニフェストファイルをJson形式に整形することが出来ませんでした。"
    },
    Manifest_fileUploadError: {
        en: "File upload failed. it retries in 3 second.",
        ja: "ファイルアップロードに失敗しました。3秒後にリトライします。"
    },
    Manifest_FormatError: {
        en: "ManifestFile is an invalid json schema.",
        ja: "マニフェストファイルのJSON形式が正しくありません。"
    },
    change_AppSettingsError: {
        en: "Failed to change application settings. it retries in 3 second.",
        ja: "アプリの設定変更に失敗しました。3秒後にリトライします。"
    },
    before_AppSettingChange: {
        en: "Start changing application settings with the following contents..",
        ja: "以下の内容でアプリの設定変更を開始します。。"
    },
    success_AppSettingChange: {
        en: "Successfully changed the setting of the application!",
        ja: "アプリの設定変更に成功しました!"
    },
    Manifest_fileUploadSuccess: {
        en: "File upload succeeded!",
        ja: "ファイルのアップロードに成功しました!"
    },
    before_AppDeploy: {
        en: "Start deploy on the kintone environment..",
        ja: "kintone環境への反映を開始します。。"
    },
    success_AppDeploy: {
        en: "Successfully deployed in the kintone environment!",
        ja: "kintone環境への反映に成功しました!"
    },
    deploy_Error: {
        en: "Failed deployed in the kintone environment. it retries in 3 second.",
        ja: "kintone環境への反映に失敗しました。3秒後にリトライします。"
    },
    targetSrc_ReadError: {
        en: "Failed to load upload target file.",
        ja: "アップロード対象ファイルの読み込みに失敗しました。"
    },
    kintoneStatus_processing: {
        en: "Kintone is in the process of changing application settings, it retries upload process in 3 second.",
        ja: "kintone側でアプリ設定の変更処理中のため、ソースアップロード処理を3秒後にリトライします。"
    },
    load_AppSettingsError: {
        en: "Failed to get JavaScript/CSS customization setting.  it retries in 3 second.",
        ja: "JavaScript/CSSカスタマイズ設定の取得に失敗しました。3秒後にリトライします。"
    },
    retry_Timeout: {
        en: "Retry timeout. The retry process is terminated.",
        ja: "リトライタイムアウト。リトライ処理を終了します。"
    },
    Interrupt_ManifestJsonParse: {
        en: "Interrupt source upload processing because analysis of manifest file failed.",
        ja: "マニフェストファイルの解析に失敗したため、ソースアップロード処理を中断します。"
    },
    get_kintoneStatusError: {
        en: "Failed to get kintone processing state. interrupt the upload process.",
        ja: "kintone処理状態の取得に失敗しました。アップロード処理を中断します。"
    },
    targetfile_NotRead: {
        en: "Can not read the source code, interrupt the upload process.",
        ja: "対象ソースコードが読めないため、アップロード処理を中断します。"
    },
    Upload_NotPermittedFormat:{
        en: "It is a file of a format not permitted to upload.",
        ja: "アップロードが許可されていない形式のファイルです。"
    }
};
/**
 * Returns a message for the passed lang and key
 * @param lang
 * @param key
 */
function getMessage(lang, key) {
    return messages[key][lang];
}
exports.getMessage = getMessage;
/**
 * Returns a function bound lang to getMessage
 * @param lang
 */
function getBoundMessage(lang) {
    return getMessage.bind(null, lang);
}
exports.getBoundMessage = getBoundMessage;
