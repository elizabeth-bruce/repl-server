'use strict';

const server = require('../../bin/www');
const rp = require('request-promise');
const wsClient = require('websocket').client;

// TODO: The below implementation of the testing code is garbage. Refactor into a more
// easily-readable WS validation library. Maybe some sort of state machine for WS?

describe('happy path server interaction', () => {
    it('completes a user journey successfully', (done) => {
        const newSessionOpts = {
            method: 'POST',
            uri: 'http://localhost:3000/sessions',
            body:  {},
            headers: {
                'Authorization': 'Basic NjQ4Y2Q1YTEtY2M5Zi00NjMzLTlmMmQtYTRlNzZmNTAwM2EzOjJmMmY5NDM0LWRmZTktNGM5OS1iNWVkLTQ3Y2U0YzA1ZWEyYw=='
            },
            json: true,
            resolveWithFullResponse: true
        };

        rp(newSessionOpts).then((response) => {
            expect(response.body.uuid).not.toBeUndefined();
            return { uuid: response.body.uuid, token: response.headers['Set-Cookie']};

        }).then((data) => {
            let client = new wsClient();

            client.on('connect', (connection) => {
                let receivedMessages = [];

                connection.on('message', (message) => {
                    const parsedMessage = JSON.parse(message.utf8Data);
                    receivedMessages.push(parsedMessage);

                    if (receivedMessages.length === 3) {
                        expect(receivedMessages[0].eventType).toEqual('registerUser');
                        expect(receivedMessages[0].data.userId).not.toBeUndefined();

                        expect(receivedMessages[1].eventType).toEqual('registerAlias');
                        expect(receivedMessages[1].data.userId).not.toBeUndefined();
                        expect(receivedMessages[1].data.alias).not.toBeUndefined();

                        expect(receivedMessages[2].eventType).toEqual('connectUser');
                        expect(receivedMessages[2].data.userId).not.toBeUndefined();
                        expect(receivedMessages[2].data.activeUsers.length).toEqual(1);

                        connection.sendUTF(JSON.stringify({verb: 'execute', data: { code: 'let a = 5;' }}));
                    }

                    if (receivedMessages.length === 4) {
                        expect(receivedMessages[3].eventType).toEqual('executionSuccess');
                        expect(receivedMessages[3].data.userId).not.toBeUndefined();
                        expect(receivedMessages[3].data.code).toEqual('let a = 5;');

                        done();
                    }
                });
            });

            client.connect(`ws://localhost:3000/sessions/${data.uuid}`);
        });
    });
});
