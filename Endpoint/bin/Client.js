"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Client {
    constructor(json) {
        this.toString = () => {
            return JSON.stringify(this.json);
        };
        this.json = json;
    }
}
exports.default = Client;
//# sourceMappingURL=Client.js.map