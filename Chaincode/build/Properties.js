"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Properties {
    constructor(json) {
        this.toString = () => {
            return JSON.stringify(Object.assign({}, this.json, { "doctype": "client" }));
        };
        this.json = json;
    }
}
exports.default = Properties;
