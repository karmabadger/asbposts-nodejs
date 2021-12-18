'use strict';

const snoowrap = require('snoowrap');
const env_vars = require('../../config/env.js');

function get_snoowrap() {

    const r = new snoowrap({
        userAgent: env_vars.REDDIT_USER_AGENT,
        clientId: env_vars.REDDIT_CLIENT_ID,
        clientSecret: env_vars.REDDIT_CLIENT_SECRET,

        username: env_vars.REDDIT_USER,
        password: env_vars.REDDIT_PWD
    });

    r.config({
        continueAfterRatelimitError: true,
        requestDelay: 1100,
    });

    return r;
}

module.exports = get_snoowrap;