# kintone-source-uploader
[![pipeline status](https://gitlab.com/k-masa2501/kintone-source-uploader/badges/master/pipeline.svg)](https://gitlab.com/k-masa2501/kintone-source-uploader/commits/master)
[![coverage report](https://gitlab.com/k-masa2501/kintone-source-uploader/badges/master/coverage.svg)](https://gitlab.com/k-masa2501/kintone-source-uploader/commits/master)  
## 概要
kintoneの以下のソースコードをアップロードすることが可能です。  
- kintoneプラグイン  
- kintoneアプリカスタマイズ用ソースコード  
- kintoneポータルカスタマイズ用ソースコード  
**アップロードによって既存の設定は上書きされます。**  

## 使い方
### インストール方法
```
% npm install --save--dev kintone-source-uploader
or
% npm install -g kintone-source-uploader
```
  
### kintoneプラグインをアップロードする場合
```
% ./node_modules/.bin/source-uploader --domain ${yourDomain} --username ${yourLoginName} --password ${yourPassword} ${pluginZipPath}
```
  
### kintoneアプリカスタマイズ用ソースコードをアップロードする場合
```
% ./node_modules/.bin/source-uploader --domain ${yourDomain} --username ${yourLoginName} --password ${yourPassword} --customSrc ${manifestFile}
```
  
### kintoneポータルカスタマイズ用ソースコードをアップロードする場合
```
% ./node_modules/.bin/source-uploader --domain ${yourDomain} --username ${yourLoginName} --password ${yourPassword} --portalSrc ${manifestFile}
```
  
### 指定できるオプション
|option  |必須/任意 |内容  |
|---|---|---|
|--domain  |必須  |kintone利用ドメインを指定します。  |
|--username  |必須  |kintoneログインユーザー名を指定します。  |
|--password  |必須  |kintoneログインパスワードを指定します。  |
|--proxy  |任意  |プロキシ―アドレスを指定します。デフォルトはproxyを設定しません。  |
|--watch  |任意  |変更を監視して再実行します。値は設定しません。デフォルトはfalseです。  |
|--lang  |任意  |en or jaを指定します。デフォルトは利用者が普段利用している言語です。  |
|--customSrc  |任意  |マニフェストファイルを相対パスで指定します。デフォルトは動作しません。  |
|--portalSrc  |任意  |マニフェストファイルを相対パスで指定します。デフォルトは動作しません。  |
|--diff   |任意  |差分アップロードします。デフォルトはfalseです。--portalSrcの指定のみ、対応しています。  |
  
--customSrcと--portalSrcは同時に指定できません。優先順位は「customSrc ＞ portalSrc ＞ pluginZip」です。

#### --proxyのフォーマット
--proxy http[s]://${proxyUserName}:${proxyPassword}@${proxyDomain}:${proxyPort}  

### マニフェストファイルのフォーマット
#### --customSrc(kintoneアプリカスタマイズ用ソースコード)
```
{
    "app": [アプリID],
    "guest_space_id": [ゲストスペースID],
    "scope": "ALL/ADMIN/NONE",
    "desktop": {
        "js": [
            {
                "type": "URL",
                "url": "https://js.cybozu.com/datatables/v1.10.19/js/jquery.dataTables.min.js" 
            },
            {
                "type": "FILE",
                "file": {
                    "name": "js/desktop/menuManage.js"
                }
            }
        ],
        "css": [
           {
                "type": "URL",
                "url": "https://cdn.datatables.net/1.10.19/css/jquery.dataTables.min.css"
            },
            {
                "type": "FILE",
                "file": {
                    "name": "css/desktop.css"
                }
            }
        ]
    },
    "mobile": {
        "js": [
            {
                "type": "URL",
                "url": "https://js.cybozu.com/datatables/v1.10.19/js/jquery.dataTables.min.js" 
            },
            {
                "type": "FILE",
                "file": {
                    "name": "js/mobile/menuManage.js"
                }
            }
        ],
        "css": [
           {
                "type": "URL",
                "url": "https://cdn.datatables.net/1.10.19/css/jquery.dataTables.min.css"
            },
            {
                "type": "FILE",
                "file": {
                    "name": "css/mobile.css"
                }
            }
        ] 
    }
}
```  
- 対象がゲストスペース内アプリの場合、guest_space_idにゲストスペースIDを設定します。そうでない場合はguest_space_idに0を指定します。
- "type": "URL"にCDNを指定します。
- "type": "FILE"にアップロード対象のファイルを**マニフェストファイルからの相対パス**で指定します。**絶対パスは指定できません。また、マニフェストファイルより上位フォルダにあるファイルの指定はお勧めできません。アップロードできますが、--watchの監視対象から外れます**。
- "scope"と"desktop"、"mobile"の意味は以下の記事を参照してください。  https://developer.cybozu.io/hc/ja/articles/204529834  


#### --portalSrc(kintoneポータルカスタマイズ用ソースコード)
```
{
    "desktop": {
        "js": [
            "lib/def_GlobalAppId.js",
            "js/Desktop/PortalPlugin.js"
        ],
        "css": [
            "css/desktop.css",
            "css/contentHeader.css"
        ]
    },
    "mobile": {
        "js": [
            "def_GlobalAppId.js",
            "js/mobile/PortalPlugin.js"
        ],
        "css": [
            "css/mobile.css",
            "css/contentHeader.css"
        ]
    }
}
```  
- ソースコードは「すべてのユーザーに適用」されます。
- "desktop"がデスクトップPC、"mobile"がモバイル端末に適用されます。
- アップロード対象のファイルを**マニフェストファイルからの相対パス**で指定します。**絶対パスは指定できません。また、マニフェストファイルより上位フォルダにあるファイルの指定はお勧めできません。アップロードできますが、--watchの監視対象から外れます**。

### expamle
#### プロキシ―の指定
```
% ./node_modules/.bin/source-uploader --domain example.cybozu.com --username exampleID --password examplePass --proxy http://exampleID:examplePass@example.com:8080 example.zip
```

#### watchオプションの指定
```
% ./node_modules/.bin/source-uploader --domain example.cybozu.com --username exampleID --password examplePass --proxy http://exampleID:examplePass@example.com:8080 --watch --portalSrc manifest.json
```
--watchオプションはマニフェストファイルの変更も監視します。アップロード対象ファイルの追加、並び替え、削除をしたい場合はマニフェストファイルを変更してください。

## 出典
本プラグインは「plugin-uploader」のソースコードを流用しています。  
https://github.com/kintone/plugin-uploader
