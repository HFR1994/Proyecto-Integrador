"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MessageHandler {
    constructor(status, message, payload) {
        this.toObject = () => {
            return { message: this.message, status: this.status, payload: this.payload };
        };
        this.toString = () => {
            return JSON.stringify({ message: this.message, status: this.status, payload: this.payload });
        };
        this.message = message;
        this.status = status;
        if (payload == null) {
            this.payload = {};
        }
        else {
            this.payload = payload;
        }
    }
}
exports.default = MessageHandler;
//# sourceMappingURL=MessageHandler.js.map