'use strict';

const rp = require('request-promise');

const createSession = function() {
    const newSessionOpts = {
        method: 'POST',
        uri: 'http://localhost:3000/sessions',
        body:  {},
        json: true
    };

    return rp(newSessionOpts);
};

module.exports = createSession;
