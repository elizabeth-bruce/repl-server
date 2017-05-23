'use strict';

const server = require('../../bin/www');
const rp = require('request-promise');
const replClient = require('../support/repl-client');
const createSession = require('../support/create-session');
const getActiveUsers = require('../support/get-active-users');
const getCookies = require('../support/get-cookies');

describe('User who reconnects after connecting once to a session', () => {
    it('persists user state from the session token stored via cookie', (done) => {
        let client, sessionId, cookieJar;

        getCookies().then((response) => {
            cookieJar = response;
            return createSession();
        }).then((response) => {
            expect(response.uuid).not.toBeUndefined();
            sessionId = response.uuid;
            return { uuid: sessionId};
        }).then((data) => {
            client = new replClient(data.uuid);
            return client.getCookies();
        }).then(() => {
            client.connect();
            return client.waitForMessages(1);
        }).then(() => {
            client.registerAlias('Bea');
            return client.waitForMessages(1);
        }).then((messages) => {
            const message = JSON.parse(messages[0].data);

            expect(message.type).toEqual('registerAlias');
            expect(message.data.newAlias).toEqual('Bea');

            client.disconnect();
            client.connect();
            return client.waitForMessages(1);
        }).then((messages) => {
            const message = JSON.parse(messages[0].data);

            expect(message.type).toEqual('connectUser');
            expect(message.data.alias).toEqual('Bea');
            done();
        });
    });
});
