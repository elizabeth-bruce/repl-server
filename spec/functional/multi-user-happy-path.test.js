'use strict';

const server = require('../../bin/www');
const rp = require('request-promise');
const replClient = require('../support/repl-client');
const createSession = require('../support/create-session');

describe('multi-user happy path server interaction', () => {
    it('completes a user journey successfully', (done) => {
        let sessionId, firstClient, secondClient, firstClientId, secondClientId;

        createSession().then((response) => {
            expect(response.sessionId).not.toBeUndefined();
            return { sessionId: response.sessionId };
        }).then((data) => {
            sessionId = data.sessionId;
        }).then(() => {
            firstClient = new replClient(sessionId);
            return firstClient.getCookies();
        }).then((jar) => {
            firstClient.connect();
            return firstClient.waitForMessages(1);
        }).then((messages) => {
            firstClientId = JSON.parse(messages[0].data).data.userId;
        }).then(() => {
            secondClient = new replClient(sessionId);
            return secondClient.getCookies();
        }).then(() => {
            secondClient.connect();
            return secondClient.waitForMessages(1);
        }).then((messages) => {
            secondClientId = JSON.parse(messages[0].data).data.userId;
        }).then(() => {
            firstClient.sendMessage({ verb: 'execute', data: { code: 'let a = 5;' }});
            return firstClient.waitForMessages(1);
        }).then((messages) => {
            const message = JSON.parse(messages[0].data);

            expect(message.type).toEqual('executionSuccess');
            expect(message.data.code).toEqual('let a = 5;');
            expect(message.data.userId).toEqual(firstClientId);
        }).then(() => {
            secondClient.sendMessage({ verb: 'execute', data: { code: 'let b = 10;' }});
            return secondClient.waitForMessages(1);
        }).then((messages) => {
            const message = JSON.parse(messages[0].data);

            expect(message.type).toEqual('executionSuccess');
            expect(message.data.code).toEqual('let b = 10;');
            expect(message.data.userId).toEqual(secondClientId);
        }).then(() => {
            firstClient.sendMessage({ verb: 'execute', data: { code: 'a + b;' }});
            return firstClient.waitForMessages(1);
        }).then((messages) => {
            const message = JSON.parse(messages[0].data);

            expect(message.type).toEqual('executionSuccess');
            expect(message.data.code).toEqual('a + b;');
            expect(message.data.result).toEqual('15');
            expect(message.data.userId).toEqual(firstClientId);

            done();
        });
    });
});
