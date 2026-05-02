"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
var backend_1 = require("@aws-amplify/backend");
exports.sendEmail = (0, backend_1.defineFunction)({
    name: 'send-email',
    entry: './handler.ts',
    timeoutSeconds: 15,
    memoryMB: 256,
    runtime: 20,
    resourceGroupName: 'data',
    environment: {
        DOMAIN: process.env.NEXT_PUBLIC_DOMAIN || 'example.com'
    }
});
