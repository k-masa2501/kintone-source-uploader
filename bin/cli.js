#!/usr/bin/env node
// Copyright (c) 2018 Cybozu, Inc.
// Released under the MIT license
// https://github.com/kintone/plugin-uploader/blob/master/LICENSE

"use strict";

const osLocale = require("os-locale");
const meow = require("meow");
const { run } = require("../dist/index");
const { getDefaultLang } = require("../dist/lang");

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

    You can set the values through environment variables
    domain: KINTONE_DOMAIN
    username: KINTONE_USERNAME
    password: KINTONE_PASSWORD
    proxy: HTTPS_PROXY or HTTP_PROXY
`,
    {
        flags: {
            domain: {
                type: "string",
                default: KINTONE_DOMAIN
            },
            username: {
                type: "string",
                default: KINTONE_USERNAME
            },
            password: {
                type: "string",
                default: KINTONE_PASSWORD
            },
            proxy: {
                type: "string",
                default: HTTPS_PROXY || HTTP_PROXY
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
                default: getDefaultLang(osLocale.sync())
            },
            customSrc: {
                type: "string",
                default: null
            },
            portalSrc: {
                type: "string",
                default: null
            }
        }
    }
);

const pluginPath = cli.input[0];

run(cli.flags, pluginPath, cli.showHelp);
