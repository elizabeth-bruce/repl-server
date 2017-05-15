'use strict';

const Worker = require('tiny-worker');

// The below function relies on the currently-undefined self and postMessage functions
// being passed in by the Worker constructor. Below, we suppress the errors that result
// from JSHint not recognizing self and postMessage

const workerFunction = function() {
    const vm = require('vm');
    const util = require('util');

    const EXEC_TIMEOUT = 5000;

    let sandbox = {};
    vm.createContext(sandbox);

    self.onmessage = function(event) { //jshint ignore:line
        const code = event.data.code,
            userId = event.data.userId;

        try {
            let script = new vm.Script(code),
                rawResult = script.runInContext(sandbox, { timeout: EXEC_TIMEOUT }),
                result = util.inspect(rawResult);

            postMessage({ data: { userId, code, result }, type: 'executionSuccess' }); //jshint ignore:line
        }
        catch (error) {
            postMessage({ data: { userId, code, error: error.message }, type: 'executionFailure' }); //jshint ignore:line
        }
    };
};

const SessionWorker = function() {
    return new Worker(workerFunction);
};

module.exports = SessionWorker;
