const rp = require('request-promise');

const getActiveUsers = function(jar, sessionId) {
    const options = {
        uri: `http://localhost:3000/sessions/${sessionId}/activeUsers`,
        jar: jar,
        json: true
    };

    return rp(options);
};

module.exports = getActiveUsers;
