/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fabric_shim_1 = __importDefault(require("fabric-shim"));
const Client_1 = __importStar(require("./Client"));
const Properties_1 = __importDefault(require("./Properties"));
const Company_1 = __importDefault(require("./Company"));
let Chaincode = class {
    // The Init method is called when the Smart Contract 'fabcar' is instantiated by the blockchain network
    // Best practice is to have any Ledger initialization in separate function -- see initLedger()
    Init(stub) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('=========== START: Instantiated PI chaincode ===========');
            console.info('=========== FINISH: Instantiated PI chaincode ===========');
            return fabric_shim_1.default.success();
        });
    }
    // The Invoke method is called as a result of an application request to run the Smart Contract
    // 'PI'. The calling application program has also specified the particular smart contract
    // function to be called, with arguments
    Invoke(stub) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = stub.getFunctionAndParameters();
            console.info(ret);
            let method = this[ret.fcn];
            if (!method) {
                console.error('No existe la función: ' + ret.fcn);
                throw new Error('Recib\u{00ED} nombre de función invalida: ' + ret.fcn);
            }
            try {
                let payload = yield method(stub, ret.params, this);
                return fabric_shim_1.default.success(payload);
            }
            catch (err) {
                console.info(err);
                return fabric_shim_1.default.error(err);
            }
        });
    }
    // Adds new Client to the Blockchain
    addClient(stub, args, thisClass) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('============= START : Add Client ===========');
            if (args.length != 2) {
                throw new Error('Número incorrecto de argumentos, espero 2 argumentos');
            }
            let information = null;
            try {
                information = JSON.parse(args[1]);
            }
            catch (err) {
                throw new Error("El segundo parametro debe ser un JSON");
            }
            let clientState = yield stub.getState(args[0]);
            if (clientState && clientState.toString()) {
                throw new Error('Ese client con ese RFC ya existe: ' + args[0]);
            }
            else {
                let user = new Client_1.default(information);
                yield stub.putState(args[0], Buffer.from(JSON.stringify(user.toObject())));
                console.info('============= END : Add Client ===========');
            }
        });
    }
    // Adds batch of new Clients to the Blockchain
    addClients(stub, args, thisClass) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('============= START : Add Client ===========');
            if (args.length != 1) {
                throw new Error('Número incorrecto de argumentos, espero 2 argumentos');
            }
            let information = null;
            try {
                information = JSON.parse(args[0]);
            }
            catch (err) {
                throw new Error("El segundo parametro debe ser un JSON");
            }
            let info = { allowed: [], rejected: [] };
            for (let i = 0; i < information.length; i++) {
                const client = information[i];
                let id = client["rfc"];
                let user = new Client_1.default(client);
                console.log(`Agregando ${user.json.rfc}`);
                info.allowed.push(id);
                yield stub.putState(id, Buffer.from(JSON.stringify(user.toObject())));
            }
            console.info('============= END : Add Client ===========');
            return Buffer.from(JSON.stringify(info));
        });
    }
    // Adds new Company to the Blockchain
    registerCompany(stub, args, thisClass) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('============= START : Add Company ===========');
            if (args.length != 2) {
                throw new Error('Número incorrecto de argumentos, espero 2 argumentos');
            }
            let information = null;
            try {
                information = JSON.parse(args[1]);
            }
            catch (err) {
                throw new Error("El segundo parametro debe ser un JSON");
            }
            let clientState = yield stub.getState(args[0]);
            if (clientState && clientState.toString()) {
                throw new Error('Esta compañia con ese nombre ya existe: ' + args[0]);
            }
            else {
                let user = new Company_1.default(information);
                yield stub.putState(args[0], Buffer.from(JSON.stringify(user.toObject())));
                console.info('============= END : Add Company ===========');
            }
        });
    }
    // Adds data the a user based on company's info
    addCompany(stub, args, thisClass) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('============= START : Add Company ===========');
            if (args.length != 3) {
                throw new Error('Número incorrecto de argumentos, espero 3 argumentos');
            }
            const client = args[0];
            const company = args[1];
            const data = args[2];
            let clientState = yield stub.getState(client);
            if (!clientState || !clientState.toString()) {
                throw new Error(`No existe este el RFC de ese cliente: ${client}`);
            }
            let companyState = yield stub.getState(company);
            if (!companyState || !companyState.toString()) {
                throw new Error(`No existe este el nombre de esa compañia: ${company}`);
            }
            let val = JSON.parse(clientState.toString());
            delete val.doctype;
            const user = new Client_1.default(val);
            if (!user.isCompanyApproved(company)) {
                throw new Error('No tienes permiso de agregar datos de este cliente');
            }
            else {
                user.addTercero(company, JSON.parse(data));
                yield stub.putState(client, Buffer.from(JSON.stringify(user.toObject())));
            }
            console.info('============= END : Add Company ===========');
        });
    }
    // Add a petition for the user to aprove access to it's data to a company
    addClientCompany(stub, args, thisClass) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('============= START : Add Client Company ===========');
            if (args.length != 2) {
                throw new Error('Número incorrecto de argumentos, espero 2 argumentos');
            }
            const client = args[0];
            const company = args[1];
            let clientState = yield stub.getState(client);
            if (!clientState || !clientState.toString()) {
                throw new Error(`No existe este el RFC de ese cliente: ${client}`);
            }
            let companyState = yield stub.getState(company);
            if (!companyState || !companyState.toString()) {
                throw new Error(`No existe este el nombre de esa compañia: ${company}`);
            }
            let val = JSON.parse(clientState.toString());
            delete val.doctype;
            const user = new Client_1.default(val);
            if (user.isCompanyPending(company)) {
                throw new Error(`Ya existe esa petición de anexo`);
            }
            else {
                user.addCompany(company, Client_1.Estatus.Esperando);
                yield stub.putState(args[0], Buffer.from(JSON.stringify(user.toObject())));
            }
            console.info('============= END : Add Client Company ===========');
        });
    }
    // Batch add, company's info to various user profiles
    addClientsToCompany(stub, args, thisClass) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('============= START : Add Client Company ===========');
            if (args.length != 2) {
                throw new Error('Número incorrecto de argumentos, espero 2 argumentos');
            }
            const company = args[1];
            let information = null;
            try {
                information = JSON.parse(args[0]);
            }
            catch (err) {
                throw new Error("El segundo parametro debe ser un JSON");
            }
            let companyState = yield stub.getState(company);
            if (!companyState || !companyState.toString()) {
                throw new Error(`No existe este el nombre de esa compañia: ${company}`);
            }
            let val1 = JSON.parse(companyState.toString());
            delete val1.doctype;
            const comp = new Company_1.default(val1);
            let info = { allowed: [], rejected: [], waiting: [] };
            for (let i = 0; i < information.length; i++) {
                const client = information[i];
                let id = client["rfc"];
                // ==== Check if client already exists ====
                let clientState = yield stub.getState(id);
                if (!clientState || !clientState.toString()) {
                    throw new Error(`No existe este el RFC del cliente: ${id}`);
                }
                else {
                    let val = JSON.parse(clientState.toString());
                    delete val.doctype;
                    const user = new Client_1.default(val);
                    if (user.isCompanyPending(company)) {
                        info.waiting.push(id);
                        continue;
                    }
                    let date = new Date();
                    let other = new Date(date.getTime() + Math.floor((Math.random() * 93) + 1) * 60000);
                    let div = information.length / 5;
                    user.addCompany(company, Client_1.Estatus.Esperando, date);
                    comp.addClient(id, Client_1.Estatus.Esperando, date);
                    yield stub.putState(id, Buffer.from(JSON.stringify(user.toObject())));
                    yield stub.putState(company, Buffer.from(JSON.stringify(comp.toObject())));
                    switch (true) {
                        case (i <= div * 3):
                            user.addCompany(company, Client_1.Estatus.Aprobado, other);
                            comp.addClient(id, Client_1.Estatus.Aprobado, other);
                            yield stub.putState(id, Buffer.from(JSON.stringify(user.toObject())));
                            yield stub.putState(company, Buffer.from(JSON.stringify(comp.toObject())));
                            info.allowed.push(id);
                            let method = thisClass['getRandom'];
                            user.addTercero(company, {
                                "consumo": yield method(["alto", "bajo", "medio"]),
                                "escliente": yield method([true, false]),
                                "producto": yield method(["Puri-100", "Puri-200", "Puri-300"])
                            });
                            yield stub.putState(id, Buffer.from(JSON.stringify(user.toObject())));
                            break;
                        case (i > div * 3 && i <= div * 4):
                            user.addCompany(company, Client_1.Estatus.Rechazado, other);
                            comp.addClient(id, Client_1.Estatus.Rechazado, other);
                            yield stub.putState(id, Buffer.from(JSON.stringify(user.toObject())));
                            yield stub.putState(company, Buffer.from(JSON.stringify(comp.toObject())));
                            info.rejected.push(id);
                            break;
                        case (i > div * 4 && i <= div * 5):
                            info.waiting.push(id);
                            break;
                    }
                }
            }
            console.info('============= END : Add Client Company ===========');
            return Buffer.from(JSON.stringify(info));
        });
    }
    // Client aproves Companies request to add information
    aproveClientCompany(stub, args, thisClass) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('============= START : Aprove Client Company ===========');
            if (args.length != 3) {
                throw new Error('Número incorrecto de argumentos, espero 3 argumentos');
            }
            const client = args[0];
            const company = args[1];
            const response = (args[2] == 'true');
            let clientState = yield stub.getState(client);
            if (!clientState || !clientState.toString()) {
                throw new Error(`No existe este el RFC de ese cliente: ${client}`);
            }
            let companyState = yield stub.getState(company);
            if (!companyState || !companyState.toString()) {
                throw new Error(`No existe este el nombre de esa compañia: ${company}`);
            }
            let val = JSON.parse(clientState.toString());
            delete val.doctype;
            let val1 = JSON.parse(companyState.toString());
            delete val1.doctype;
            const user = new Client_1.default(val);
            const comp = new Company_1.default(val1);
            if (response) {
                user.addCompany(company, Client_1.Estatus.Aprobado);
                comp.addClient(client, Client_1.Estatus.Aprobado);
                yield stub.putState(client, Buffer.from(JSON.stringify(user.toObject())));
                yield stub.putState(company, Buffer.from(JSON.stringify(comp.toObject())));
            }
            else {
                user.addCompany(company, Client_1.Estatus.Rechazado);
                comp.addClient(client, Client_1.Estatus.Rechazado);
                yield stub.putState(client, Buffer.from(JSON.stringify(user.toObject())));
                yield stub.putState(company, Buffer.from(JSON.stringify(comp.toObject())));
            }
            console.info('============= END : Aprove Client Company ===========');
        });
    }
    //Generate a random choice from a list of possible values
    getRandom(list) {
        return __awaiter(this, void 0, void 0, function* () {
            const random = Math.floor((Math.random() * list.length - 1) + 1);
            return list[random];
        });
    }
    // Check if company is on approved list
    isClientOnCompany(stub, args, thisClass) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('============= START : Query Client ===========');
            if (args.length != 1) {
                throw new Error('Número incorrecto de argumentos, espero compañia y cliente');
            }
            let client = args[0];
            let company = args[1];
            let clientState = yield stub.getState(client);
            if (!clientState || !clientState.toString()) {
                throw new Error(`No existe este el RFC de ese cliente: ${client}`);
            }
            let companyState = yield stub.getState(company);
            if (!companyState || !companyState.toString()) {
                throw new Error(`No existe este el nombre de esa compañia: ${company}`);
            }
            let usuario = JSON.parse(clientState.toString());
            delete usuario.doctype;
            const user = new Client_1.default(usuario);
            console.info('============= END : Query Client ===========');
            return Buffer.from(user.isCompanyApproved(company).toString());
        });
    }
    // Query a client
    queryClient(stub, args, thisClass) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('============= START : Query Client ===========');
            if (args.length != 1) {
                throw new Error('Número incorrecto de argumentos, espero RFC');
            }
            let clientId = args[0];
            let clientAsBytes = yield stub.getState(clientId); //get the clientId from chaincode state
            if (!clientAsBytes || clientAsBytes.toString().length <= 0) {
                throw new Error(`No existe este el id del cliente: ${clientId}`);
            }
            let user = JSON.parse(clientAsBytes.toString());
            delete user.password;
            delete user.isHashed;
            delete user.aprobaciones;
            console.info('============= END : Query Client ===========');
            return Buffer.from(JSON.stringify(user));
        });
    }
    //Validate client login
    loginUser(stub, args, thisClass) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('============= START : Login Client ===========');
            if (args.length != 2) {
                throw new Error('Número incorrecto de argumentos, espero rfc y password');
            }
            let clientId = args[0];
            let clientAsBytes = yield stub.getState(clientId); //get the clientId from chaincode state
            if (!clientAsBytes || clientAsBytes.toString().length <= 0) {
                return Buffer.from("false");
            }
            let user = JSON.parse(clientAsBytes.toString());
            let client = new Client_1.default(user);
            console.info('============= END : Login Client ===========');
            return yield client.validateLogin(args[1]).then((result) => {
                return Buffer.from(result.toString());
            }).catch((err) => {
                throw new Error(err);
            });
        });
    }
    //Validate companies login
    loginCompany(stub, args, thisClass) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('============= START : Login Company ===========');
            if (args.length != 2) {
                throw new Error('Número incorrecto de argumentos, espero user y password');
            }
            let clientId = args[0];
            let clientAsBytes = yield stub.getState(clientId); //get the clientId from chaincode state
            if (!clientAsBytes || clientAsBytes.toString().length <= 0) {
                return Buffer.from("false");
            }
            let user = JSON.parse(clientAsBytes.toString());
            let client = new Company_1.default(user);
            console.info('============= END : Login Company ===========');
            return yield client.validateLogin(args[1]).then((result) => {
                return Buffer.from(result.toString());
            }).catch((err) => {
                throw new Error(err);
            });
        });
    }
    //Get the transaction history from a given key
    getOrganizationHistory(stub, args, thisClass) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('============= START : Get Organization History ===========');
            if (args.length != 1) {
                throw new Error('Número incorrecto de argumentos, espero nombre del usuario');
            }
            let resultsIterator = yield stub.getHistoryForKey(args[0]);
            let method = thisClass['getAllResults'];
            let results = yield method(resultsIterator, true);
            console.info('============= END : Get Organization History ===========');
            return Buffer.from(JSON.stringify(results));
        });
    }
    //Query the state of user's for a given company
    queryClientsByCompany(stub, args, thisClass) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('============= START : Query Client By Company ===========');
            if (args.length != 1) {
                throw new Error('Número incorrecto de argumentos, espero nombre de la compañia');
            }
            let company = args[0];
            let companyState = yield stub.getState(company);
            if (!companyState || !companyState.toString()) {
                throw new Error(`No existe este el nombre de esa compañia: ${company}`);
            }
            let val1 = JSON.parse(companyState.toString());
            delete val1.doctype;
            const comp = new Company_1.default(val1);
            console.info('============= END : Query Client By Company ===========');
            const list = comp.getStatusList();
            let method = thisClass['queryClient'];
            for (let i = 0; i < list.approved.length; i++) {
                let result = yield method(stub, [list.approved[i].client], thisClass);
                list.approved[i].client = JSON.parse(result.toString('utf8'));
            }
            let info = { approved: list.approved, rejected: list.rejected, waiting: list.waiting };
            return Buffer.from(JSON.stringify(info));
        });
    }
    //Query the state of a company's for a given user
    queryCompaniesByClient(stub, args, thisClass) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('============= START : Query Company By Client ===========');
            if (args.length != 1) {
                throw new Error('Número incorrecto de argumentos, espero RFC del cliente');
            }
            let client = args[0];
            let clientState = yield stub.getState(client);
            if (!clientState || !clientState.toString()) {
                throw new Error(`No existe este el RFC de ese cliente: ${client}`);
            }
            let val1 = JSON.parse(clientState.toString());
            delete val1.doctype;
            const comp = new Client_1.default(val1);
            console.info('============= END : Query Client By Company ===========');
            return Buffer.from(JSON.stringify(comp.getStatusList()));
        });
    }
    //Get client by a attribute
    queryClientByAttributes(stub, args, thisClass) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('============= START : Query Client by Attributes ===========');
            if (args.length < 1) {
                throw new Error('Incorrect number of arguments. Expecting owner name.');
            }
            let queryString = null;
            try {
                queryString = { selector: new Properties_1.default(JSON.parse(args[0])) };
            }
            catch (err) {
                throw new Error('El string no esta en formato JSON');
            }
            let method = thisClass['getQueryResultForQueryString'];
            console.info('============= END : Query Client by Attributes ===========');
            return yield method(stub, JSON.stringify(queryString), thisClass);
        });
    }
    //Interanal method used queryClientByAttributes
    getQueryResultForQueryString(stub, queryString, thisClass) {
        return __awaiter(this, void 0, void 0, function* () {
            let resultsIterator = yield stub.getQueryResult(queryString);
            let method = thisClass['getAllResults'];
            let results = yield method(resultsIterator, false);
            return Buffer.from(JSON.stringify(results));
        });
    }
    //Iterate a prettify a given iterator
    getAllResults(iterator, isHistory) {
        return __awaiter(this, void 0, void 0, function* () {
            let allResults = [];
            while (true) {
                let res = yield iterator.next();
                if (res.value && res.value.value.toString()) {
                    let jsonRes = {};
                    console.info(res.value.value.toString('utf8'));
                    if (isHistory && isHistory === true) {
                        jsonRes["TxId"] = res.value.tx_id;
                        jsonRes["Timestamp"] = res.value.timestamp;
                        jsonRes["IsDelete"] = res.value.is_delete.toString();
                        try {
                            const json = JSON.parse(res.value.value.toString('utf8'));
                            delete json.password;
                            delete json.isHashed;
                            delete json.aprobaciones;
                            jsonRes["Value"] = json;
                        }
                        catch (err) {
                            console.info(err);
                            jsonRes["Value"] = res.value.value.toString('utf8');
                        }
                    }
                    else {
                        jsonRes["Key"] = res.value.key;
                        try {
                            const json = JSON.parse(res.value.value.toString('utf8'));
                            delete json.password;
                            delete json.isHashed;
                            delete json.aprobaciones;
                            jsonRes["Value"] = json;
                        }
                        catch (err) {
                            console.info(err);
                            jsonRes["Record"] = res.value.value.toString('utf8');
                        }
                    }
                    allResults.push(jsonRes);
                }
                if (res.done) {
                    yield iterator.close();
                    console.info(allResults);
                    return allResults;
                }
            }
        });
    }
};
exports.default = Chaincode;
