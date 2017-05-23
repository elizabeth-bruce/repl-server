'use strict';

const rp = require('request-promise');

const registerAlias = function(jar, sessionId) {
    const options = {
        uri: `http://localhost:3000/sessions/${sessionId}/registerAlias`,
        jar: jar,
        method: 'POST',
        json: true,
        body: {

        }
    };

    return rp(options);
};

module.exports = registerAlias;
