'use strict';

const server = require('../../bin/www');
const rp = require('request-promise');
const replClient = require('../support/repl-client');
const createSession = require('../support/create-session');
const getActiveUsers = require('../support/get-active-users');
const getCookies = require('../support/get-cookies');

describe('happy path server interaction', () => {
    it('completes a user journey successfully', (done) => {
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
        }).then((messages) => {
            const parsedMessages = messages.map((message) => message.data).map(JSON.parse);
            expect(parsedMessages[0].type).toEqual('connectUser');
            expect(parsedMessages[0].data.userId).not.toBeUndefined();
        }).then(() => {
            return getActiveUsers(cookieJar, sessionId);
        }).then((message) => {
           const users = message;
           expect(users.length).toEqual(1);
        }).then(() => {
            client.sendMessage({ verb: 'execute', data: { code: 'let a = 5;' }});
            return client.waitForMessages(1);
        }).then((messages) => {
            const parsedMessage = JSON.parse(messages[0].data);

            expect(parsedMessage.type).toEqual('executionSuccess');
            expect(parsedMessage.data.userId).not.toBeUndefined();
            expect(parsedMessage.data.code).toEqual('let a = 5;');
        }).then(() => {
            client.sendMessage({ verb: 'execute', data: { code: 'a;' }});
            return client.waitForMessages(1);
        }).then((messages) => {
            const parsedMessage = JSON.parse(messages[0].data);

            expect(parsedMessage.type).toEqual('executionSuccess');
            expect(parsedMessage.data.userId).not.toBeUndefined();
            expect(parsedMessage.data.code).toEqual('a;');
            expect(parsedMessage.data.result).toEqual('5');

            done();
        });
    });
});
