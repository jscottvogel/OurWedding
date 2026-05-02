"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askIvy = void 0;
var backend_1 = require("@aws-amplify/backend");
exports.askIvy = (0, backend_1.defineFunction)({
    name: 'ask-ivy',
    entry: './handler.ts',
    timeoutSeconds: 30, // Bedrock can take a few seconds
    resourceGroupName: 'data',
});
