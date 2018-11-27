"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = __importDefault(require("request"));
class KeyProtect {
    constructor() {
        this.BXINST = "876d5e5a-bc3a-438d-8299-b2381e4b1b21";
        this.BXAPI = "nIRDWIlkT-2Irz5Ut5h_MhQMBQRG2AZgWBnsxAwHm24C";
        this.BXURL = "https://iam.bluemix.net/identity/token";
        this.ERR_KP_CREDS = 'The Key Protect credentials are not define.';
        this.autorization = '';
        this.startTime = undefined;
    }
    validateAutorization() {
        if (this.startTime === undefined || this.autorization === '') {
            return false;
        }
        else {
            const currentDate = new Date();
            const sameDay = (this.startTime.getDay === currentDate.getDay);
            const sameMonth = (this.startTime.getMonth === currentDate.getMonth);
            const spendTime = ((currentDate.getTime() - this.startTime.getTime()) / 1000) < 3540;
            if ((sameMonth && sameDay) && spendTime) {
                console.log('The authentication yet is valid.');
                return true;
            }
            else {
                this.startTime = undefined;
                return false;
            }
        }
    }
    getAutorizationToken() {
        const self = this;
        return new Promise((resolver, reject) => __awaiter(this, void 0, void 0, function* () {
            if (!this.BXAPI || !this.BXURL) {
                console.error(this.ERR_KP_CREDS);
                reject(new Error(this.ERR_KP_CREDS));
            }
            const options = {
                method: 'POST',
                url: this.BXURL,
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    accept: 'application/json'
                },
                form: {
                    apikey: this.BXAPI,
                    grant_type: 'urn:ibm:params:oauth:grant-type:apikey'
                }
            };
            yield request_1.default(options, function (error, response, body) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (error) {
                        reject(error);
                    }
                    const result = JSON.parse(body);
                    if (response.statusCode !== 200) {
                        console.error('an error occurred try to getToken for KeyProtect');
                        reject(new Error(result.errorMessage));
                    }
                    self.autorization = result.token_type + ' ' + result.access_token;
                    self.startTime = new Date();
                    resolver();
                });
            });
        }));
    }
    getKey(keyname) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.validateAutorization()) {
                yield this.getAutorizationToken();
            }
            const idkey = yield this.getIdKey(keyname);
            const options = {
                headers: {
                    authorization: this.autorization,
                    'bluemix-instance': this.BXINST,
                    accept: 'application/vnd.ibm.collection+json',
                },
                method: 'GET',
                url: 'https://keyprotect.us-south.bluemix.net/api/v2/keys/' + idkey
            };
            return new Promise((resolver, reject) => __awaiter(this, void 0, void 0, function* () {
                yield request_1.default(options, function (error, response, body) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (error) {
                            reject(error);
                        }
                        else if (response.statusCode !== 200) {
                            reject(new Error(JSON.parse(body).errorMessage));
                        }
                        else {
                            resolver(JSON.parse(body).resources[0].payload);
                        }
                    });
                });
            }));
        });
    }
    getIdKey(keyname) {
        const options = {
            headers: {
                authorization: this.autorization,
                'bluemix-instance': this.BXINST,
                accept: 'application/vnd.ibm.collection+json',
            },
            method: 'GET',
            url: 'https://keyprotect.us-south.bluemix.net/api/v2/keys'
        };
        return new Promise((resolver, reject) => __awaiter(this, void 0, void 0, function* () {
            yield request_1.default(options, (error, response, body) => {
                if (error) {
                    reject(error);
                }
                if (response.statusCode !== 200) {
                    reject(new Error(JSON.parse(body).errorMessage));
                }
                let id = '';
                const jsonResponse = JSON.parse(body);
                if (!jsonResponse.resources || jsonResponse.resources.length === 0) {
                    reject(new Error('The key: ' + keyname + ' do not exist!'));
                }
                else {
                    jsonResponse.resources.forEach(key => {
                        if (keyname === key.name) {
                            id = key.id;
                            resolver(id);
                        }
                    });
                }
            });
        }));
    }
}
exports.KeyProtect = KeyProtect;
//# sourceMappingURL=keyProtect.js.map