"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfExport = void 0;
var backend_1 = require("@aws-amplify/backend");
exports.pdfExport = (0, backend_1.defineFunction)({
    name: 'pdf-export',
    entry: './handler.ts',
    timeoutSeconds: 60,
    memoryMB: 1024,
    runtime: 20,
    resourceGroupName: 'data',
});
