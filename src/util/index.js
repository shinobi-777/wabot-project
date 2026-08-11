'use strict';

const { WhatsWebURL, DefaultOptions } = require('./konfigurasi');
const { logInfo, logError } = require('./logger');
const { exposeFunctionIfAbsent } = require('./Puppeteer');
const Util = require('./Util');

module.exports = {
    WhatsWebURL,
    DefaultOptions,
    logInfo,
    logError,
    exposeFunctionIfAbsent,
    Util,
};
