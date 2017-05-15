'use strict';

const instanceObject = {
    getUserId: (sessionId, token) => Promise.resolve('abcde'),
    getAlias: (sessionId, token) => Promise.resolve('Test User'),
    setAlias: (sessionId, token, alias) => Promise.resolve(null),
    setUserId: (sessionId, token, userId) => Promise.resolve(null)
};

const MockSessionUserClient = instanceObject;

module.exports = MockSessionUserClient;
