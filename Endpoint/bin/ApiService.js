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
const axios_1 = __importDefault(require("axios"));
class ApiService {
    // I initialize the ApiClient.
    constructor() {
        this.user = 'org3';
        this.password = '5HAaPa5fEdrF11x4vfLp7IhzzBzuo9ElroMHYqzLlAwZen_lpql8XUxtmtUktoHn';
        this.NETWORK_ID = 'n7dc3e3218b8c4b289b95f923fd28553f';
        // The ApiClient wraps calls to the underlying Axios client.
        this.axiosClient = axios_1.default.create({
            auth: {
                username: this.user,
                password: this.password
            },
        });
    }
    // I perform a GET request with the given options.
    get(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.axiosClient.request({
                method: 'get',
                url: options.url,
                params: options.params
            }).then((response) => {
                return response.data;
            }).catch((err) => {
                console.log(err);
                return (this.normalizeError(err));
            });
        });
    }
    // I perform a POST request with the given options.
    post(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.axiosClient.request({
                method: 'post',
                url: options.url,
                data: options.params
            }).then((response) => {
                return response.data;
            }).catch((err) => {
                return (Promise.reject(this.normalizeError(err)));
            });
        });
    }
    // ---
    // PRIVATE METHODS.
    // ---
    // Errors can occur for a variety of reasons. I normalize the error response so that
    // the calling context can assume a standard error structure.
    normalizeError(error) {
        // NOTE: Since I'm not really dealing with a production API, this doesn't really
        // normalize anything (ie, this is not the focus of this demo).
        return ({
            id: '-1',
            code: 'UnknownError',
            message: 'An unexpected error occurred.'
        });
    }
}
exports.ApiService = ApiService;
//# sourceMappingURL=ApiService.js.map