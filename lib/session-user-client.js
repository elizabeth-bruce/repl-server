'use strict';

const Redis = require('redis');
const Bluebird = require('bluebird');

Bluebird.promisifyAll(Redis.RedisClient.prototype);

const SessionUserClient = (function() {
    let instance;

    function init() {
        let client = Redis.createClient();

        const redisKeys = {
            ALIAS: 'alias',
            USER_ID: 'userId'
        }

        function keyOf(sessionId, sessionToken) {
            return `alias:${sessionId}:${sessionToken}`;
        }

        function setAlias(sessionId, sessionToken, alias) {
            return client.hsetAsync(keyOf(sessionId, sessionToken), redisKeys.ALIAS, alias);
        }

        function setUserId(sessionId, sessionToken, userId) {
            return client.hsetAsync(keyOf(sessionId, sessionToken), redisKeys.USER_ID, userId);
        }

        function expireUser(sessionId, sessionToken, timeout) {
            return client.expireAsync(keyOf(sessionId, sessionToken), timeout);
        }

        function getAlias(sessionId, sessionToken) {
            return client.hgetAsync(keyOf(sessionId, sessionToken), redisKeys.ALIAS);
        }

        function getUserId(sessionId, sessionToken) {
            return client.hgetAsync(keyOf(sessionId, sessionToken), redisKeys.USER_ID);
        }

        function clearUser(sessionId, sessionToken) {
            return client.delAsync(keyOf(sessionId, sessionToken));
        }

        return {
            setAlias,
            getAlias,
            setUserId,
            getUserId,
            expireUser,
            clearUser
        };
    }

    return {
        getInstance() {
            if (!instance) {
                instance = init();
            }
            return instance;
        }
    };

})();

module.exports = SessionUserClient;
