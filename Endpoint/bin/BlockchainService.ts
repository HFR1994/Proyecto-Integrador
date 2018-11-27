import Fabric_Client from "fabric-client";
import Fabric_CA_Client from "fabric-ca-client";
import path from "path";
import {ApiService} from "./ApiService";
import Client from './Client'
import MessageHandler from './MessageHandler'
import Company from "./Company";

interface Propuesta{
    chaincodeId: string,
    fcn: string,
    args: Array<any>
    chainId: string,
    txId:  Fabric_Client.TransactionId
}

export class BlockchainService {

    private data: ApiService;
    private connectionProfile: any;
    private fabric_client = new Fabric_Client();
    private fabric_ca_client = null;
    private admin_user = null;
    private store_path = path.join("..", __dirname, 'datos', 'hfc-key-store');
    private chaincode = "PIT";
    private channelId = "transaction-pi";
    private channel = null;
    private peersID = ["org3-peer2c3a"];
    private peers = [];

    constructor() {
        this.data = new ApiService();
        this.channel = this.fabric_client.newChannel(this.channelId);
    }

    public async initializeConnection(){
        return await this.data.get(
            {
                //url: `https://ibmblockchain-staging-starter.stage1.ng.bluemix.net/api/v1/networks/${this.data.NETWORK_ID}/connection_profile`,
                url: `https://blockchain-starter.ng.bluemix.net/api/v1/networks/${this.data.NETWORK_ID}/connection_profile`,
            }
        ).then((e) => {
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

            const o = this.fabric_client.newOrderer(e.orderers.orderer.url, {pem: e.orderers.orderer.tlsCACerts.pem, 'ssl-target-name-override': null});
            this.channel.addOrderer(o);
            this.channel.add
            return this.enrollAdmin();
        }).catch((err) => {
            throw new Error('No me puedo connectar con el Blockchain');
        })
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

        return Fabric_Client.newDefaultKeyValueStore({path: this.store_path})
            .then((state_store) => {
                this.fabric_client.setStateStore(state_store);
                const crypto_suite = Fabric_Client.newCryptoSuite();
                //const crypto_store = Fabric_Client.newCryptoKeyStore({path: this.store_path});
                //crypto_suite.setCryptoKeyStore(crypto_store);
                this.fabric_client.setCryptoSuite(crypto_suite);
                const tlsOptions = {
                    trustedRoots: new Buffer([]),
                    verify: false
                };
                return new Fabric_CA_Client(`https://${id}:${secret}@${url}`, tlsOptions, caName, crypto_suite);
            }).then((fabric_ca_client) => {
                this.fabric_ca_client = fabric_ca_client;
                return fabric_ca_client;
            }).catch((err) => {
                console.log(err);
            })
    }

    async enrollAdmin() {
        // @ts-ignore
        const org = Object.keys(this.connectionProfile.certificateAuthorities)[0];
        // @ts-ignore
        const id = this.connectionProfile.certificateAuthorities[org].registrar[0].enrollId;
        // @ts-ignore
        const secret = this.connectionProfile.certificateAuthorities[org].registrar[0].enrollSecret;
        // @ts-ignore
        const mSpid = this.connectionProfile.certificateAuthorities[org]['x-mspid'];

        return await this.generateKeyStore().then(() => {
            return this.fabric_client.getUserContext(id, false);
        }).then((user_from_store) => {
            if (user_from_store && user_from_store.isEnrolled()) {
                console.log('Logre cargar al administrador de persistencia');
                this.admin_user = user_from_store;
                return this.admin_user;
            }else{
                return this.fabric_ca_client.enroll({
                    enrollmentID: id,
                    enrollmentSecret: secret
                }).then((enrollment) => {
                    console.log('Logre enrolar al usuario "admin"');
                    // noinspection TypeScriptValidateJSTypes
                    return this.fabric_client.createUser(
                        {
                            username: id,
                            mspid: mSpid,
                            cryptoContent: {privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate},
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
    }

    public async registerUser(username: string, password: string, affiliation: string) {
        const org = Object.keys(this.connectionProfile.certificateAuthorities)[0];
        const mSpid = this.connectionProfile.certificateAuthorities[org]['x-mspid'];
        return await this.enrollAdmin().then(() => {
            return this.fabric_ca_client.register({
                enrollmentID: username,
                enrollmentSecret: password,
                affiliation: affiliation,
                role: 'client'
            }, this.admin_user);
        }).then((secret) => {
            // next we need to enroll the user with CA server
            console.log(`Logre asignar ${username} - password: ` + secret);
            return this.fabric_ca_client.enroll({enrollmentID: username, enrollmentSecret: secret});
        }).then((enrollment) => {
            console.log(`Logre enrolar al usuario "${username}"`);
            return this.fabric_client.createUser(
                {
                    username: username,
                    mspid: mSpid,
                    cryptoContent: {privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate},
                    skipPersistence: true
                });
        }).then((user) => {
            console.log(`El usuario "${username}" se logró enrolar y está listo para interactuar con el Blockchain`);
            return user;
        }).catch((err) => {
            console.error('Falle en registrar: ' + err);
            return({
                id: '-1',
                code: 'BadRequest',
                message: `El usuario ${username} ya existe`
            });
        });
    }

    private async sendProposal(propuesta: Propuesta){
        return await this.channel.sendTransactionProposal(propuesta).then((results) => {
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
                            } else {
                                resolve(return_status);
                            }
                        }, (err) => {
                            reject(new Error('Hay un problema con eventhub: ' + err));
                        },
                        { disconnect: true } //disconnect when complete
                    );
                    event_hub.connect();
                });
                promises.push(txPromise);
                return Promise.all(promises);
            } else {
                const val = proposalResponses[0].message.toString();
                return Promise.reject(val.replace("2 UNKNOWN: error executing chaincode: transaction returned with failure: Error: ",""));
            }
        }).then((results) => {
            if (!(results && results[0] && results[0].status === 'SUCCESS')) {
                return Promise.reject('Falle en enviar la transacción al orderer. Error: ' + results[0].status);
            }
            if (!(results && results[1] && results[1].event_status === 'VALID')) {
                return Promise.reject('La transacción fallo al anexarse al Blockchain de peer. Error: ' + results[1].event_status);
            }
            return new MessageHandler(200, `Realize la transacción exitosamente, tu transacción es la ${propuesta.txId.getTransactionID()}`);
        }).catch((err) => {
            return new MessageHandler(400, err);
        });
    }

    private async queryChaincode(propuesta: Propuesta){
        return await this.channel.queryByChaincode(propuesta).then((query_responses) => {
            if (query_responses && query_responses[0].length != 1) {
                if (query_responses[0] instanceof Error) {
                    let valor = `${query_responses[0].toString().replace("Error: 2 UNKNOWN: error executing chaincode: transaction returned with failure: Error: ", "")}`;
                    valor = `${valor.toString().replace("Error: transaction returned with failure: Error: ", "")}`;
                    return Promise.reject(valor);
                } else {
                    if(query_responses[0].toString() === "true" || query_responses[0].toString() === "false"){
                        return new MessageHandler(200, "Exito! Todo salio de forma correcta", query_responses[0].toString() === "true");
                    }else {
                        let val = JSON.parse(query_responses[0].toString());
                        return new MessageHandler(200, "Exito! Todo salio de forma correcta", val);
                    }
                }
            } else {
                return new MessageHandler(404, "No hubo resultados...");
            }
        }).catch((err) => {
            console.info(err);
            return new MessageHandler(400, err);
        });
    }

    public async registerClient(id: string ,userInfo: Client){
        return await this.enrollAdmin().then(() => {
            let tx_id = this.fabric_client.newTransactionID();

            var request = {
                chaincodeId: this.chaincode,
                fcn: "addClient",
                args: [id, JSON.stringify(userInfo)],
                chainId: this.channel,
                txId: tx_id
            };

            return this.sendProposal(request)
        })
    }

    public async registerCompany(id: string ,userInfo: Company){
        return await this.enrollAdmin().then(() => {
            let tx_id = this.fabric_client.newTransactionID();

            var request = {
                chaincodeId: this.chaincode,
                fcn: "registerCompany",
                args: [id, JSON.stringify(userInfo)],
                chainId: this.channel,
                txId: tx_id
            };

            return this.sendProposal(request)
        })
    }

    public async aproveCompany(client: string, company: string, approve: string){
        return await this.enrollAdmin().then(() => {
            let tx_id = this.fabric_client.newTransactionID();

            var request = {
                chaincodeId: this.chaincode,
                fcn: "aproveClientCompany",
                args: [client, company, approve],
                chainId: this.channel,
                txId: tx_id
            };

            return this.sendProposal(request)
        })
    }

    public async addClientCompany(client: string, company: string){
        return await this.enrollAdmin().then(() => {
            let tx_id = this.fabric_client.newTransactionID();

            var request = {
                chaincodeId: this.chaincode,
                fcn: "addClientCompany",
                args: [client, company],
                chainId: this.channel,
                txId: tx_id
            };

            return this.sendProposal(request)
        })
    }

    public async addCompany(client: string, company: string, data: string){
        return await this.enrollAdmin().then(() => {
            let tx_id = this.fabric_client.newTransactionID();

            var request = {
                chaincodeId: this.chaincode,
                fcn: "addCompany",
                args: [client, company, data],
                chainId: this.channel,
                txId: tx_id
            };

            return this.sendProposal(request)
        })
    }

    public async queryClient(id: string){
        let tx_id = this.fabric_client.newTransactionID();
        var request = {
            chaincodeId: this.chaincode,
            fcn: "queryClient",
            args: [id],
            chainId: this.channel,
            txId: tx_id
        };

        return this.queryChaincode(request)
    };

    public async queryClientByHistory(id: string){
        let tx_id = this.fabric_client.newTransactionID();
        var request = {
            chaincodeId: this.chaincode,
            fcn: "getOrganizationHistory",
            args: [id],
            chainId: this.channel,
            txId: tx_id
        };

        return this.queryChaincode(request)
    };

    public async loginUser(id: string, password: string){
        let tx_id = this.fabric_client.newTransactionID();
        var request = {
            chaincodeId: this.chaincode,
            fcn: "loginUser",
            args: [id, password],
            chainId: this.channel,
            txId: tx_id
        };

        return this.queryChaincode(request)
    };

    public async loginCompany(id: string, password: string){
        let tx_id = this.fabric_client.newTransactionID();
        var request = {
            chaincodeId: this.chaincode,
            fcn: "loginCompany",
            args: [id, password],
            chainId: this.channel,
            txId: tx_id
        };

        return this.queryChaincode(request)
    };

    public async queryClientByCompany(id: string){
        let tx_id = this.fabric_client.newTransactionID();
        var request = {
            chaincodeId: this.chaincode,
            fcn: "queryClientsByCompany",
            args: [id],
            chainId: this.channel,
            txId: tx_id
        };

        return this.queryChaincode(request)
    };

    public async isClientOnCompany(client: string, company:string){
        let tx_id = this.fabric_client.newTransactionID();
        var request = {
            chaincodeId: this.chaincode,
            fcn: "isClientOnCompany",
            args: [client, company],
            chainId: this.channel,
            txId: tx_id
        };

        return this.queryChaincode(request)
    };

    public async queryCompaniesByClient(id: string){
        let tx_id = this.fabric_client.newTransactionID();
        var request = {
            chaincodeId: this.chaincode,
            fcn: "queryCompaniesByClient",
            args: [id],
            chainId: this.channel,
            txId: tx_id
        };

        return this.queryChaincode(request)
    };
}
