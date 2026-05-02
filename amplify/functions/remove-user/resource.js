"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeUser = void 0;
var backend_1 = require("@aws-amplify/backend");
exports.removeUser = (0, backend_1.defineFunction)({
    name: 'remove-user',
    entry: './handler.ts',
    timeoutSeconds: 15,
    memoryMB: 256,
    runtime: 20,
    resourceGroupName: 'data',
});
