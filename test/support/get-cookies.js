const rp = require('request-promise');

const getCookies = function() {
    const jar = rp.jar();

    const options = {
        uri: 'http://localhost:3000/sessions/touch',
        resolveWithFullResponse: true,
        jar: jar
    };

    return rp(options).then((_) => jar);
};

module.exports = getCookies;
