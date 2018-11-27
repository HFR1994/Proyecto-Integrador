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
const Validation_1 = require("./Validation");
const bcrypt_1 = __importDefault(require("bcrypt"));
var Estatus;
(function (Estatus) {
    Estatus[Estatus["Aprobado"] = 0] = "Aprobado";
    Estatus[Estatus["Rechazado"] = 1] = "Rechazado";
    Estatus[Estatus["Esperando"] = 2] = "Esperando";
})(Estatus = exports.Estatus || (exports.Estatus = {}));
class Client {
    constructor(json) {
        this.toObject = () => {
            return Object.assign({}, this.json, { doctype: "client", isHashed: true });
        };
        this.toString = () => {
            return JSON.stringify(Object.assign({}, this.json, { "doctype": "client", isHashed: true }));
        };
        const required = ["rfc", "curp", "apellidoPaterno", "apellidoMaterno", "nombres", "password"];
        this.json = json;
        if (json.terceros == null) {
            this.json["terceros"] = {};
        }
        if (json.aprobaciones == null) {
            this.json["aprobaciones"] = {
                approved: [],
                waiting: [],
                rejected: []
            };
        }
        const validators = {};
        validators["RFC"] = new Validation_1.Validation.RFCValidator();
        validators["CURP"] = new Validation_1.Validation.CURPValidator();
        validators["Email"] = new Validation_1.Validation.EmailValidator();
        const current = Object.keys(json).map((key) => key);
        var result = required.filter(function (e) {
            let i = current.indexOf(e);
            return i == -1 ? true : (current.splice(i, 1), false);
        });
        if (result.length == 1) {
            throw new Error(`Falto el siguiente parametro: ${result.toString().replace(/,/g, ', ')}`);
        }
        else if (result.length >= 1) {
            throw new Error(`Faltaron los siguientes parametros: ${result.toString().replace(/,/g, ', ')}`);
        }
        if (!validators["CURP"].isAcceptable(json.curp)) {
            throw new Error('No puedo validar el curp' + this.json.curp);
        }
        if (!validators["RFC"].isAcceptable(json.rfc)) {
            throw new Error('No puedo validar el rfc' + this.json.rfc);
        }
        if (json.email) {
            if (!validators["Email"].isAcceptable(json.email)) {
                throw new Error('No puedo validar el email');
            }
        }
        if (!json.isHashed) {
            json.password = bcrypt_1.default.hashSync(json.password, 10);
        }
    }
    validateLogin(password) {
        return __awaiter(this, void 0, void 0, function* () {
            return bcrypt_1.default.compareSync(password, this.json.password);
        });
    }
    addCompany(target, type, baseDate = new Date()) {
        let current = baseDate;
        let today = current;
        this.json.aprobaciones.approved = this.json.aprobaciones.approved.filter(function (value) {
            if (value.company != target) {
                return true;
            }
            else {
                current = value.created;
                return false;
            }
        });
        this.json.aprobaciones.rejected = this.json.aprobaciones.rejected.filter(function (value) {
            if (value.company != target) {
                return true;
            }
            else {
                current = value.created;
                return false;
            }
        });
        this.json.aprobaciones.waiting = this.json.aprobaciones.waiting.filter(function (value) {
            if (value.company != target) {
                return true;
            }
            else {
                current = value.created;
                return false;
            }
        });
        switch (type) {
            case Estatus.Aprobado:
                this.json.aprobaciones.approved.push({
                    company: target,
                    created: current,
                    modified: today,
                });
                break;
            case Estatus.Rechazado:
                this.json.aprobaciones.rejected.push({
                    company: target,
                    created: current,
                    modified: today,
                });
                break;
            case Estatus.Esperando:
                this.json.aprobaciones.waiting.push({
                    company: target,
                    created: current,
                    modified: today,
                });
                break;
        }
    }
    isCompanyPending(target) {
        let i;
        const list = this.json.aprobaciones.waiting;
        for (i = 0; i < list.length; i++) {
            if (list[i].company === target) {
                return true;
            }
        }
        return false;
    }
    isCompanyApproved(target) {
        let i;
        const list = this.json.aprobaciones.approved;
        for (i = 0; i < list.length; i++) {
            if (list[i].company === target) {
                return true;
            }
        }
        return false;
    }
    getStatusList() {
        return this.json.aprobaciones;
    }
    addTercero(target, properties) {
        this.json.terceros[target] = Object.assign({}, this.json.terceros[target], Object.assign({}, properties));
    }
}
exports.default = Client;
