'use strict';

const rp = require('request-promise');

const createSession = function(jar) {
    const newSessionOpts = {
        method: 'POST',
        uri: 'http://localhost:3000/sessions',
        body:  {},
        json: true,
        jar: jar
    };

    return rp(newSessionOpts);
};

module.exports = createSession;
