"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pi_1 = __importDefault(require("./pi"));
const fabric_shim_1 = __importDefault(require("fabric-shim"));
fabric_shim_1.default.start(new pi_1.default());
