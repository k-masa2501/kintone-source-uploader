#!/usr/bin/env node
// Copyright (c) 2018 Cybozu, Inc.
// Released under the MIT license
// https://github.com/kintone/plugin-uploader/blob/master/LICENSE

"use strict";

import { osLocaleSync } from 'os-locale';
import meow from "meow";
import { run } from "../dist/index.js";
import { getDefaultLang } from  "../dist/lang.js";

const {
    HTTP_PROXY,
    HTTPS_PROXY,
    KINTONE_DOMAIN,
    KINTONE_USERNAME,
    KINTONE_PASSWORD
} = process.env;

const cli = meow(
    `
  Usage
      $ source-uploader [OPTION] <pluginPath>
    OR
      $ source-uploader [OPTION] --customSrc <manifestPath>
    OR
      $ source-uploader [OPTION] --portalSrc <manifestPath>
  Options
    --domain Domain of your kintone
    --username Login username
    --password User's password
    --proxy Proxy server
    --watch Watch the changes of plugin zip and re-run
    --waiting-dialog-ms A ms for waiting show a input dialog
    --lang Using language (en or ja)
    --customSrc specify customSrc manifest file.
    --portalSrc specify portalSrc manifest file.
    --all all js upload.

    You can set the values through environment variables
    domain: KINTONE_DOMAIN
    username: KINTONE_USERNAME
    password: KINTONE_PASSWORD
    proxy: HTTPS_PROXY or HTTP_PROXY
`,
    {
        importMeta: import.meta,
        flags: {
            domain: {
                type: "string",
                default: KINTONE_DOMAIN || ""
            },
            username: {
                type: "string",
                default: KINTONE_USERNAME || ""
            },
            password: {
                type: "string",
                default: KINTONE_PASSWORD || ""
            },
            proxy: {
                type: "string",
                default: HTTPS_PROXY || HTTP_PROXY || ""
            },
            watch: {
                type: "boolean",
                default: false
            },
            waitingDialogMs: {
                type: "number",
                default: 0
            },
            lang: {
                type: "string",
                default: getDefaultLang(osLocaleSync())
            },
            customSrc: {
                type: "string",
                default: ""
            },
            portalSrc: {
                type: "string",
                default: ""
            },
            all: {
                type: "boolean",
                default: false
            }
        }
    }
);

const pluginPath = cli.input[0];

run(cli.flags, pluginPath, cli.showHelp);
