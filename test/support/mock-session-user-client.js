'use strict';

const instanceObject = {
    getUserId(sessionId, token) { return Promise.resolve('abcde'); },
    getAlias(sessionId, token) { return Promise.resolve('Test User'); },
    setAlias(sessionId, token, alias) { return Promise.resolve(null); },
    setUserId(sessionId, token, userId) { return Promise.resolve(null); }
};

const MockSessionUserClient = {
    getInstance() {
        return instanceObject;
    }
};

module.exports = MockSessionUserClient;
