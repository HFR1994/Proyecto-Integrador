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
const bcrypt_1 = __importDefault(require("bcrypt"));
var Estatus;
(function (Estatus) {
    Estatus[Estatus["Aprobado"] = 0] = "Aprobado";
    Estatus[Estatus["Rechazado"] = 1] = "Rechazado";
    Estatus[Estatus["Esperando"] = 2] = "Esperando";
})(Estatus || (Estatus = {}));
class Company {
    constructor(json) {
        this.toObject = () => {
            return Object.assign({}, this.json, { doctype: "company", isHashed: true });
        };
        this.toString = () => {
            return JSON.stringify(Object.assign({}, this.json, { "doctype": "company", isHashed: true }));
        };
        const required = ["user", "password"];
        this.json = json;
        if (json.aprobaciones == null) {
            this.json["aprobaciones"] = {
                approved: [],
                waiting: [],
                rejected: []
            };
        }
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
        if (!json.isHashed) {
            json.password = bcrypt_1.default.hashSync(json.password, 10);
        }
    }
    validateLogin(password) {
        return __awaiter(this, void 0, void 0, function* () {
            return bcrypt_1.default.compareSync(password, this.json.password);
        });
    }
    isClientPending(target) {
        let i;
        const list = this.json.aprobaciones.waiting;
        for (i = 0; i < list.length; i++) {
            if (list[i].client === target) {
                return true;
            }
        }
        return false;
    }
    addClient(target, type, baseDate = new Date()) {
        let current = baseDate;
        let today = current;
        this.json.aprobaciones.approved = this.json.aprobaciones.approved.filter(function (value) {
            if (value.client != target) {
                return true;
            }
            else {
                current = value.created;
                return false;
            }
        });
        this.json.aprobaciones.rejected = this.json.aprobaciones.rejected.filter(function (value) {
            if (value.client != target) {
                return true;
            }
            else {
                current = value.created;
                return false;
            }
        });
        this.json.aprobaciones.waiting = this.json.aprobaciones.waiting.filter(function (value) {
            if (value.client != target) {
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
                    client: target,
                    created: current,
                    modified: today,
                });
                break;
            case Estatus.Rechazado:
                this.json.aprobaciones.rejected.push({
                    client: target,
                    created: current,
                    modified: today,
                });
                break;
            case Estatus.Esperando:
                this.json.aprobaciones.waiting.push({
                    client: target,
                    created: current,
                    modified: today,
                });
                break;
        }
    }
    getStatusList() {
        return this.json.aprobaciones;
    }
}
module.exports.Estatus = Estatus;
exports.default = Company;
