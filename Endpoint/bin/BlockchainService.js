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
const fabric_client_1 = __importDefault(require("fabric-client"));
const fabric_ca_client_1 = __importDefault(require("fabric-ca-client"));
const path_1 = __importDefault(require("path"));
const ApiService_1 = require("./ApiService");
const MessageHandler_1 = __importDefault(require("./MessageHandler"));
class BlockchainService {
    constructor() {
        this.fabric_client = new fabric_client_1.default();
        this.fabric_ca_client = null;
        this.admin_user = null;
        this.store_path = path_1.default.join("..", __dirname, 'datos', 'hfc-key-store');
        this.chaincode = "PIT";
        this.channelId = "transaction-pi";
        this.channel = null;
        this.peersID = ["org3-peer2c3a"];
        this.peers = [];
        this.data = new ApiService_1.ApiService();
        this.channel = this.fabric_client.newChannel(this.channelId);
    }
    initializeConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.data.get({
                //url: `https://ibmblockchain-staging-starter.stage1.ng.bluemix.net/api/v1/networks/${this.data.NETWORK_ID}/connection_profile`,
                url: `https://blockchain-starter.ng.bluemix.net/api/v1/networks/${this.data.NETWORK_ID}/connection_profile`,
            }).then((e) => {
                this.connectionProfile = e;
                const org = Object.keys(this.connectionProfile.certificateAuthorities)[0];
                const mSpid = this.connectionProfile.certificateAuthorities[org]['x-mspid'];
                for (let i = 0; i < this.peersID.length; i++) {
                    let peer = this.peersID[i];
                    let p = this.fabric_client.newPeer(e.peers[peer].url, {
                        pem: e.peers[peer].tlsCACerts.pem,
                        'ssl-target-name-override': null
                    });
                    this.peers.push(p);
                    this.channel.addPeer(p, mSpid);
                }
                const o = this.fabric_client.newOrderer(e.orderers.orderer.url, { pem: e.orderers.orderer.tlsCACerts.pem, 'ssl-target-name-override': null });
                this.channel.addOrderer(o);
                this.channel.add;
                return this.enrollAdmin();
            }).catch((err) => {
                throw new Error('No me puedo connectar con el Blockchain');
            });
        });
    }
    generateKeyStore() {
        // @ts-ignore
        const org = Object.keys(this.connectionProfile.certificateAuthorities)[0];
        // @ts-ignore
        const url = this.connectionProfile.certificateAuthorities[org].url.substring(8, 1000);
        // @ts-ignore
        const id = this.connectionProfile.certificateAuthorities[org].registrar[0].enrollId;
        // @ts-ignore
        const secret = this.connectionProfile.certificateAuthorities[org].registrar[0].enrollSecret;
        // @ts-ignore
        const caName = this.connectionProfile.certificateAuthorities[org].caName;
        return fabric_client_1.default.newDefaultKeyValueStore({ path: this.store_path })
            .then((state_store) => {
            this.fabric_client.setStateStore(state_store);
            const crypto_suite = fabric_client_1.default.newCryptoSuite();
            //const crypto_store = Fabric_Client.newCryptoKeyStore({path: this.store_path});
            //crypto_suite.setCryptoKeyStore(crypto_store);
            this.fabric_client.setCryptoSuite(crypto_suite);
            const tlsOptions = {
                trustedRoots: new Buffer([]),
                verify: false
            };
            return new fabric_ca_client_1.default(`https://${id}:${secret}@${url}`, tlsOptions, caName, crypto_suite);
        }).then((fabric_ca_client) => {
            this.fabric_ca_client = fabric_ca_client;
            return fabric_ca_client;
        }).catch((err) => {
            console.log(err);
        });
    }
    enrollAdmin() {
        return __awaiter(this, void 0, void 0, function* () {
            // @ts-ignore
            const org = Object.keys(this.connectionProfile.certificateAuthorities)[0];
            // @ts-ignore
            const id = this.connectionProfile.certificateAuthorities[org].registrar[0].enrollId;
            // @ts-ignore
            const secret = this.connectionProfile.certificateAuthorities[org].registrar[0].enrollSecret;
            // @ts-ignore
            const mSpid = this.connectionProfile.certificateAuthorities[org]['x-mspid'];
            return yield this.generateKeyStore().then(() => {
                return this.fabric_client.getUserContext(id, false);
            }).then((user_from_store) => {
                if (user_from_store && user_from_store.isEnrolled()) {
                    console.log('Logre cargar al administrador de persistencia');
                    this.admin_user = user_from_store;
                    return this.admin_user;
                }
                else {
                    return this.fabric_ca_client.enroll({
                        enrollmentID: id,
                        enrollmentSecret: secret
                    }).then((enrollment) => {
                        console.log('Logre enrolar al usuario "admin"');
                        // noinspection TypeScriptValidateJSTypes
                        return this.fabric_client.createUser({
                            username: id,
                            mspid: mSpid,
                            cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate },
                            skipPersistence: true
                        });
                    }).then((user) => {
                        this.admin_user = user;
                        return this.fabric_client.setUserContext(this.admin_user, true);
                    }).catch((err) => {
                        console.error('Falle en enrolar y persistir en usuario “admin”, Error: ' + err.stack ? err.stack : err);
                        throw new Error('La dirección es invalida');
                    });
                }
            }).then(() => {
                console.log('Asigne a “admin” como un usuario de fabric-client');
                return this.admin_user;
            }).catch((err) => {
                console.error('Falle en enrolar a “admin”: ' + err);
            });
        });
    }
    registerUser(username, password, affiliation) {
        return __awaiter(this, void 0, void 0, function* () {
            const org = Object.keys(this.connectionProfile.certificateAuthorities)[0];
            const mSpid = this.connectionProfile.certificateAuthorities[org]['x-mspid'];
            return yield this.enrollAdmin().then(() => {
                return this.fabric_ca_client.register({
                    enrollmentID: username,
                    enrollmentSecret: password,
                    affiliation: affiliation,
                    role: 'client'
                }, this.admin_user);
            }).then((secret) => {
                // next we need to enroll the user with CA server
                console.log(`Logre asignar ${username} - password: ` + secret);
                return this.fabric_ca_client.enroll({ enrollmentID: username, enrollmentSecret: secret });
            }).then((enrollment) => {
                console.log(`Logre enrolar al usuario "${username}"`);
                return this.fabric_client.createUser({
                    username: username,
                    mspid: mSpid,
                    cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate },
                    skipPersistence: true
                });
            }).then((user) => {
                console.log(`El usuario "${username}" se logró enrolar y está listo para interactuar con el Blockchain`);
                return user;
            }).catch((err) => {
                console.error('Falle en registrar: ' + err);
                return ({
                    id: '-1',
                    code: 'BadRequest',
                    message: `El usuario ${username} ya existe`
                });
            });
        });
    }
    sendProposal(propuesta) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.channel.sendTransactionProposal(propuesta).then((results) => {
                var proposalResponses = results[0];
                var proposal = results[1];
                let isProposalGood = false;
                if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
                    isProposalGood = true;
                }
                if (isProposalGood) {
                    var request = {
                        proposalResponses: proposalResponses,
                        proposal: proposal
                    };
                    var transaction_id_string = propuesta.txId.getTransactionID(); //Get the transaction ID string to be used by the event processing
                    var promises = [];
                    var sendPromise = this.channel.sendTransaction(request);
                    promises.push(sendPromise);
                    let event_hub = this.channel.newChannelEventHub(this.peers[0]);
                    let txPromise = new Promise((resolve, reject) => {
                        let handle = setTimeout(() => {
                            event_hub.unregisterTxEvent(transaction_id_string);
                            event_hub.disconnect();
                            resolve({ event_status: 'TIMEOUT' }); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
                        }, 50000);
                        event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
                            clearTimeout(handle);
                            var return_status = { event_status: code, tx_id: transaction_id_string };
                            if (code !== 'VALID') {
                                resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
                            }
                            else {
                                resolve(return_status);
                            }
                        }, (err) => {
                            reject(new Error('Hay un problema con eventhub: ' + err));
                        }, { disconnect: true } //disconnect when complete
                        );
                        event_hub.connect();
                    });
                    promises.push(txPromise);
                    return Promise.all(promises);
                }
                else {
                    const val = proposalResponses[0].message.toString();
                    return Promise.reject(val.replace("2 UNKNOWN: error executing chaincode: transaction returned with failure: Error: ", ""));
                }
            }).then((results) => {
                if (!(results && results[0] && results[0].status === 'SUCCESS')) {
                    return Promise.reject('Falle en enviar la transacción al orderer. Error: ' + results[0].status);
                }
                if (!(results && results[1] && results[1].event_status === 'VALID')) {
                    return Promise.reject('La transacción fallo al anexarse al Blockchain de peer. Error: ' + results[1].event_status);
                }
                return new MessageHandler_1.default(200, `Realize la transacción exitosamente, tu transacción es la ${propuesta.txId.getTransactionID()}`);
            }).catch((err) => {
                return new MessageHandler_1.default(400, err);
            });
        });
    }
    queryChaincode(propuesta) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.channel.queryByChaincode(propuesta).then((query_responses) => {
                if (query_responses && query_responses[0].length != 1) {
                    if (query_responses[0] instanceof Error) {
                        let valor = `${query_responses[0].toString().replace("Error: 2 UNKNOWN: error executing chaincode: transaction returned with failure: Error: ", "")}`;
                        valor = `${valor.toString().replace("Error: transaction returned with failure: Error: ", "")}`;
                        return Promise.reject(valor);
                    }
                    else {
                        if (query_responses[0].toString() === "true" || query_responses[0].toString() === "false") {
                            return new MessageHandler_1.default(200, "Exito! Todo salio de forma correcta", query_responses[0].toString() === "true");
                        }
                        else {
                            let val = JSON.parse(query_responses[0].toString());
                            return new MessageHandler_1.default(200, "Exito! Todo salio de forma correcta", val);
                        }
                    }
                }
                else {
                    return new MessageHandler_1.default(404, "No hubo resultados...");
                }
            }).catch((err) => {
                console.info(err);
                return new MessageHandler_1.default(400, err);
            });
        });
    }
    registerClient(id, userInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.enrollAdmin().then(() => {
                let tx_id = this.fabric_client.newTransactionID();
                var request = {
                    chaincodeId: this.chaincode,
                    fcn: "addClient",
                    args: [id, JSON.stringify(userInfo)],
                    chainId: this.channel,
                    txId: tx_id
                };
                return this.sendProposal(request);
            });
        });
    }
    registerCompany(id, userInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.enrollAdmin().then(() => {
                let tx_id = this.fabric_client.newTransactionID();
                var request = {
                    chaincodeId: this.chaincode,
                    fcn: "registerCompany",
                    args: [id, JSON.stringify(userInfo)],
                    chainId: this.channel,
                    txId: tx_id
                };
                return this.sendProposal(request);
            });
        });
    }
    aproveCompany(client, company, approve) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.enrollAdmin().then(() => {
                let tx_id = this.fabric_client.newTransactionID();
                var request = {
                    chaincodeId: this.chaincode,
                    fcn: "aproveClientCompany",
                    args: [client, company, approve],
                    chainId: this.channel,
                    txId: tx_id
                };
                return this.sendProposal(request);
            });
        });
    }
    addClientCompany(client, company) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.enrollAdmin().then(() => {
                let tx_id = this.fabric_client.newTransactionID();
                var request = {
                    chaincodeId: this.chaincode,
                    fcn: "addClientCompany",
                    args: [client, company],
                    chainId: this.channel,
                    txId: tx_id
                };
                return this.sendProposal(request);
            });
        });
    }
    addCompany(client, company, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.enrollAdmin().then(() => {
                let tx_id = this.fabric_client.newTransactionID();
                var request = {
                    chaincodeId: this.chaincode,
                    fcn: "addCompany",
                    args: [client, company, data],
                    chainId: this.channel,
                    txId: tx_id
                };
                return this.sendProposal(request);
            });
        });
    }
    queryClient(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let tx_id = this.fabric_client.newTransactionID();
            var request = {
                chaincodeId: this.chaincode,
                fcn: "queryClient",
                args: [id],
                chainId: this.channel,
                txId: tx_id
            };
            return this.queryChaincode(request);
        });
    }
    ;
    queryClientByHistory(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let tx_id = this.fabric_client.newTransactionID();
            var request = {
                chaincodeId: this.chaincode,
                fcn: "getOrganizationHistory",
                args: [id],
                chainId: this.channel,
                txId: tx_id
            };
            return this.queryChaincode(request);
        });
    }
    ;
    loginUser(id, password) {
        return __awaiter(this, void 0, void 0, function* () {
            let tx_id = this.fabric_client.newTransactionID();
            var request = {
                chaincodeId: this.chaincode,
                fcn: "loginUser",
                args: [id, password],
                chainId: this.channel,
                txId: tx_id
            };
            return this.queryChaincode(request);
        });
    }
    ;
    loginCompany(id, password) {
        return __awaiter(this, void 0, void 0, function* () {
            let tx_id = this.fabric_client.newTransactionID();
            var request = {
                chaincodeId: this.chaincode,
                fcn: "loginCompany",
                args: [id, password],
                chainId: this.channel,
                txId: tx_id
            };
            return this.queryChaincode(request);
        });
    }
    ;
    queryClientByCompany(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let tx_id = this.fabric_client.newTransactionID();
            var request = {
                chaincodeId: this.chaincode,
                fcn: "queryClientsByCompany",
                args: [id],
                chainId: this.channel,
                txId: tx_id
            };
            return this.queryChaincode(request);
        });
    }
    ;
    isClientOnCompany(client, company) {
        return __awaiter(this, void 0, void 0, function* () {
            let tx_id = this.fabric_client.newTransactionID();
            var request = {
                chaincodeId: this.chaincode,
                fcn: "isClientOnCompany",
                args: [client, company],
                chainId: this.channel,
                txId: tx_id
            };
            return this.queryChaincode(request);
        });
    }
    ;
    queryCompaniesByClient(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let tx_id = this.fabric_client.newTransactionID();
            var request = {
                chaincodeId: this.chaincode,
                fcn: "queryCompaniesByClient",
                args: [id],
                chainId: this.channel,
                txId: tx_id
            };
            return this.queryChaincode(request);
        });
    }
    ;
}
exports.BlockchainService = BlockchainService;
//# sourceMappingURL=BlockchainService.js.map