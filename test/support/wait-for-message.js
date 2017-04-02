'use strict';

const nextMessageWrapper = function(ws) {
    const currentMessageHandler = ws.onmessage || (() => {});

    const promiseConstructor = function(resolve, reject) {
        let messageQueue = [],
        numMessages = this.numMessages;

        ws.onmessage = function(message) {
            messageQueue.push(message);
            currentMessageHandler.call(ws, message);
            if (messageQueue.length === numMessages) {
                resolve(messageQueue);
            }
        }
    };

    ws.waitForMessages = function(numMessages) {
        const messagePromise = new Promise(promiseConstructor.bind({
            numMessages: numMessages
        }));

        return messagePromise;
    };

    return ws;
};

module.exports = nextMessageWrapper;
