"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Company {
    constructor(json) {
        this.toString = () => {
            return JSON.stringify(this.json);
        };
        this.json = json;
    }
}
exports.default = Company;
//# sourceMappingURL=Company.js.map