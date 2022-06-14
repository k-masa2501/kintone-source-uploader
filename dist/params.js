// Copyright (c) 2018 Cybozu, Inc.
// Released under the MIT license
// https://github.com/kintone/plugin-uploader/blob/master/LICENSE

"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};

import inquirer from "inquirer";
import {getBoundMessage} from "./messages.js";

const inquireParams = ({ username, password, domain, lang }) => {
    const m = getBoundMessage(lang);
    const questions = [
        {
            type: "input",
            message: m("Q_Domain"),
            name: "domain",
            default: domain,
            when: () => !domain,
            validate: (v) => !!v
        },
        {
            type: "input",
            name: "username",
            message: m("Q_UserName"),
            default: username,
            when: () => !username,
            validate: (v) => !!v
        },
        {
            type: "password",
            name: "password",
            message: m("Q_Password"),
            default: password,
            when: () => !password,
            validate: (v) => !!v
        }
    ];
    return inquirer
        .prompt(questions)
        .then(answers => Object.assign({ username, password, domain }, answers));
};

export { inquireParams } ;