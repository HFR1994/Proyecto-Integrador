/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

"use strict";

import shim from 'fabric-shim';
import Client, {Estatus} from "./Client";
import Properties from "./Properties";
import Company from "./Company";

let Chaincode = class{

    // The Init method is called when the Smart Contract 'fabcar' is instantiated by the blockchain network
    // Best practice is to have any Ledger initialization in separate function -- see initLedger()
    async Init(stub) {
        console.info('=========== START: Instantiated PI chaincode ===========');
        console.info('=========== FINISH: Instantiated PI chaincode ===========');
        return shim.success();
    }

    // The Invoke method is called as a result of an application request to run the Smart Contract
    // 'PI'. The calling application program has also specified the particular smart contract
    // function to be called, with arguments
    async Invoke(stub) {
        let ret = stub.getFunctionAndParameters();
        console.info(ret);

        let method = this[ret.fcn];
        if (!method) {
            console.error('No existe la función: ' + ret.fcn );
            throw new Error('Recib\u{00ED} nombre de función invalida: ' + ret.fcn);
        }
        try {
            let payload = await method(stub, ret.params, this);
            return shim.success(payload);
        } catch (err) {
            console.info(err);
            return shim.error(err);
        }
    }

    // Adds new Client to the Blockchain
    async addClient(stub, args, thisClass) {
        console.info('============= START : Add Client ===========');

        if (args.length != 2) {
            throw new Error('Número incorrecto de argumentos, espero 2 argumentos');
        }

        let information = null;
        try {
            information = JSON.parse(args[1])
        }catch (err) {
            throw new Error("El segundo parametro debe ser un JSON");
        }

        let clientState = await stub.getState(args[0]);
        if (clientState && clientState.toString()) {
            throw new Error('Ese client con ese RFC ya existe: ' + args[0]);
        }else {
            let user = new Client(information);

            await stub.putState(args[0], Buffer.from(JSON.stringify(user.toObject())));

            console.info('============= END : Add Client ===========');
        }
    }

    // Adds batch of new Clients to the Blockchain
    async addClients(stub, args, thisClass) {
        console.info('============= START : Add Client ===========');

        if (args.length != 1) {
            throw new Error('Número incorrecto de argumentos, espero 2 argumentos');
        }

        let information = null;
        try {
            information = JSON.parse(args[0])
        }catch (err) {
            throw new Error("El segundo parametro debe ser un JSON");
        }

        let info = {allowed: [], rejected: []};
        for(let i=0; i<information.length;i++){
            const client = information[i];
            let id = client["rfc"];
            let user = new Client(client);
            console.log(`Agregando ${user.json.rfc}`);
            info.allowed.push(id);
            await stub.putState(id, Buffer.from(JSON.stringify(user.toObject())));

        }

        console.info('============= END : Add Client ===========');

        return Buffer.from(JSON.stringify(info));
    }

    // Adds new Company to the Blockchain
    async registerCompany(stub, args, thisClass) {
        console.info('============= START : Add Company ===========');

        if (args.length != 2) {
            throw new Error('Número incorrecto de argumentos, espero 2 argumentos');
        }

        let information = null;
        try {
            information = JSON.parse(args[1])
        }catch (err) {
            throw new Error("El segundo parametro debe ser un JSON");
        }

        let clientState = await stub.getState(args[0]);
        if (clientState && clientState.toString()) {
            throw new Error('Esta compañia con ese nombre ya existe: ' + args[0]);
        }else {
            let user = new Company(information);

            await stub.putState(args[0], Buffer.from(JSON.stringify(user.toObject())));

            console.info('============= END : Add Company ===========');
        }
    }

    // Adds data the a user based on company's info
    async addCompany(stub, args, thisClass) {
        console.info('============= START : Add Company ===========');

        if (args.length != 3) {
            throw new Error('Número incorrecto de argumentos, espero 3 argumentos');
        }

        const client = args[0];
        const company = args[1];
        const data = args[2];

        let clientState = await stub.getState(client);
        if (!clientState || !clientState.toString()) {
            throw new Error(`No existe este el RFC de ese cliente: ${client}`);
        }

        let companyState = await stub.getState(company);
        if (!companyState || !companyState.toString()) {
            throw new Error(`No existe este el nombre de esa compañia: ${company}`);
        }

        let val = JSON.parse(clientState.toString());
        delete val.doctype;
        const user = new Client(val);

        if (!user.isCompanyApproved(company)) {
            throw new Error('No tienes permiso de agregar datos de este cliente');
        }else {
            user.addTercero(company, JSON.parse(data));
            await stub.putState(client, Buffer.from(JSON.stringify(user.toObject())));
        }
        console.info('============= END : Add Company ===========');
    }

    // Add a petition for the user to aprove access to it's data to a company
    async addClientCompany(stub, args, thisClass) {
        console.info('============= START : Add Client Company ===========');

        if (args.length != 2) {
            throw new Error('Número incorrecto de argumentos, espero 2 argumentos');
        }

        const client = args[0];
        const company = args[1];

        let clientState = await stub.getState(client);
        if (!clientState || !clientState.toString()) {
            throw new Error(`No existe este el RFC de ese cliente: ${client}`);
        }

        let companyState = await stub.getState(company);
        if (!companyState || !companyState.toString()) {
            throw new Error(`No existe este el nombre de esa compañia: ${company}`);
        }

        let val = JSON.parse(clientState.toString());
        delete val.doctype;
        const user = new Client(val);

        if(user.isCompanyPending(company)){
            throw new Error(`Ya existe esa petición de anexo`);
        }else{
            user.addCompany(company, Estatus.Esperando);
            await stub.putState(args[0], Buffer.from(JSON.stringify(user.toObject())));
        }

        console.info('============= END : Add Client Company ===========');
    }

    // Batch add, company's info to various user profiles
    async addClientsToCompany(stub, args, thisClass){
        console.info('============= START : Add Client Company ===========');

        if (args.length != 2) {
            throw new Error('Número incorrecto de argumentos, espero 2 argumentos');
        }

        const company = args[1];

        let information = null;
        try {
            information = JSON.parse(args[0])
        }catch (err) {
            throw new Error("El segundo parametro debe ser un JSON");
        }

        let companyState = await stub.getState(company);
        if (!companyState || !companyState.toString()) {
            throw new Error(`No existe este el nombre de esa compañia: ${company}`);
        }

        let val1 = JSON.parse(companyState.toString());
        delete val1.doctype;
        const comp = new Company(val1);

        let info = {allowed: [], rejected: [], waiting: []};
        for(let i=0; i<information.length;i++){
            const client = information[i];
            let id = client["rfc"];
            // ==== Check if client already exists ====
            let clientState = await stub.getState(id);
            if (!clientState || !clientState.toString()) {
                throw new Error(`No existe este el RFC del cliente: ${id}`);
            }else {
                let val = JSON.parse(clientState.toString());
                delete val.doctype;
                const user = new Client(val);

                if(user.isCompanyPending(company)){
                    info.waiting.push(id);
                    continue;
                }

                let date = new Date();
                let other = new Date(date.getTime() + Math.floor((Math.random() * 93) + 1)*60000);

                let div = information.length/5;

                user.addCompany(company, Estatus.Esperando, date);
                comp.addClient(id, Estatus.Esperando, date);

                await stub.putState(id, Buffer.from(JSON.stringify(user.toObject())));
                await stub.putState(company, Buffer.from(JSON.stringify(comp.toObject())));

                switch (true) {
                    case (i<=div*3):
                        user.addCompany(company, Estatus.Aprobado, other);
                        comp.addClient(id, Estatus.Aprobado, other);
                        await stub.putState(id, Buffer.from(JSON.stringify(user.toObject())));
                        await stub.putState(company, Buffer.from(JSON.stringify(comp.toObject())));

                        info.allowed.push(id);

                        let method = thisClass['getRandom'];

                        user.addTercero(company, {
                            "consumo": await method(["alto", "bajo", "medio"]),
                            "escliente": await method([true, false]),
                            "producto": await method(["Puri-100", "Puri-200", "Puri-300"])
                        });

                        await stub.putState(id, Buffer.from(JSON.stringify(user.toObject())));

                        break;
                    case (i>div*3 && i<=div*4):
                        user.addCompany(company, Estatus.Rechazado, other);
                        comp.addClient(id, Estatus.Rechazado, other);
                        await stub.putState(id, Buffer.from(JSON.stringify(user.toObject())));
                        await stub.putState(company, Buffer.from(JSON.stringify(comp.toObject())));

                        info.rejected.push(id);
                        break;
                    case (i>div*4 && i<=div*5):
                        info.waiting.push(id);
                        break;
                }
            }
        }
        console.info('============= END : Add Client Company ===========');
        return Buffer.from(JSON.stringify(info));
    }

    // Client aproves Companies request to add information
    async aproveClientCompany(stub, args, thisClass){
        console.info('============= START : Aprove Client Company ===========');

        if (args.length != 3) {
            throw new Error('Número incorrecto de argumentos, espero 3 argumentos');
        }

        const client = args[0];
        const company = args[1];
        const response = (args[2] == 'true');

        let clientState = await stub.getState(client);
        if (!clientState || !clientState.toString()) {
            throw new Error(`No existe este el RFC de ese cliente: ${client}`);
        }

        let companyState = await stub.getState(company);
        if (!companyState || !companyState.toString()) {
            throw new Error(`No existe este el nombre de esa compañia: ${company}`);
        }

        let val = JSON.parse(clientState.toString());
        delete val.doctype;
        let val1 = JSON.parse(companyState.toString());
        delete val1.doctype;
        const user = new Client(val);
        const comp = new Company(val1);

        if(response){
            user.addCompany(company, Estatus.Aprobado);
            comp.addClient(client, Estatus.Aprobado);
            await stub.putState(client, Buffer.from(JSON.stringify(user.toObject())));
            await stub.putState(company, Buffer.from(JSON.stringify(comp.toObject())));
        }else{
            user.addCompany(company, Estatus.Rechazado);
            comp.addClient(client, Estatus.Rechazado);
            await stub.putState(client, Buffer.from(JSON.stringify(user.toObject())));
            await stub.putState(company, Buffer.from(JSON.stringify(comp.toObject())));
        }

        console.info('============= END : Aprove Client Company ===========');
    }

    //Generate a random choice from a list of possible values
    async getRandom(list: Array<any>){
        const random = Math.floor((Math.random() * list.length-1) + 1);
        return list[random];
    }

    // Check if company is on approved list
    async isClientOnCompany(stub, args, thisClass) {
        console.info('============= START : Query Client ===========');

        if (args.length != 1) {
            throw new Error('Número incorrecto de argumentos, espero compañia y cliente');
        }

        let client = args[0];
        let company = args[1];

        let clientState = await stub.getState(client);
        if (!clientState || !clientState.toString()) {
            throw new Error(`No existe este el RFC de ese cliente: ${client}`);
        }

        let companyState = await stub.getState(company);
        if (!companyState || !companyState.toString()) {
            throw new Error(`No existe este el nombre de esa compañia: ${company}`);
        }

        let usuario = JSON.parse(clientState.toString());
        delete usuario.doctype;

        const user = new Client(usuario);

        console.info('============= END : Query Client ===========');
        return Buffer.from(user.isCompanyApproved(company).toString());
    }

    // Query a client
    async queryClient(stub, args, thisClass) {
        console.info('============= START : Query Client ===========');

        if (args.length != 1) {
            throw new Error('Número incorrecto de argumentos, espero RFC');
        }

        let clientId = args[0];

        let clientAsBytes = await stub.getState(clientId); //get the clientId from chaincode state
        if (!clientAsBytes || clientAsBytes.toString().length <= 0) {
            throw new Error(`No existe este el id del cliente: ${clientId}`);
        }

        let user = JSON.parse(clientAsBytes.toString());
        delete user.password;
        delete user.isHashed;
        delete user.aprobaciones;

        console.info('============= END : Query Client ===========');
        return Buffer.from(JSON.stringify(user));
    }

    //Validate client login
    async loginUser(stub, args, thisClass){
        console.info('============= START : Login Client ===========');

        if (args.length != 2) {
            throw new Error('Número incorrecto de argumentos, espero rfc y password');
        }

        let clientId = args[0];

        let clientAsBytes = await stub.getState(clientId); //get the clientId from chaincode state
        if (!clientAsBytes || clientAsBytes.toString().length <= 0) {
            return Buffer.from("false");
        }

        let user = JSON.parse(clientAsBytes.toString());
        let client = new Client(user);

        console.info('============= END : Login Client ===========');
        return await client.validateLogin(args[1]).then((result) =>{
            return Buffer.from(result.toString());
        }).catch((err) =>{
            throw new Error(err);
        });
    }

    //Validate companies login
    async loginCompany(stub, args, thisClass){
        console.info('============= START : Login Company ===========');

        if (args.length != 2) {
            throw new Error('Número incorrecto de argumentos, espero user y password');
        }

        let clientId = args[0];

        let clientAsBytes = await stub.getState(clientId); //get the clientId from chaincode state
        if (!clientAsBytes || clientAsBytes.toString().length <= 0) {
            return Buffer.from("false");
        }

        let user = JSON.parse(clientAsBytes.toString());
        let client = new Company(user);

        console.info('============= END : Login Company ===========');
        return await client.validateLogin(args[1]).then((result) =>{
            return Buffer.from(result.toString());
        }).catch((err) =>{
            throw new Error(err);
        });
    }

    //Get the transaction history from a given key
    async getOrganizationHistory(stub, args, thisClass) {
        console.info('============= START : Get Organization History ===========');

        if (args.length != 1) {
            throw new Error('Número incorrecto de argumentos, espero nombre del usuario');
        }

        let resultsIterator = await stub.getHistoryForKey(args[0]);
        let method = thisClass['getAllResults'];
        let results = await method(resultsIterator, true);

        console.info('============= END : Get Organization History ===========');
        return Buffer.from(JSON.stringify(results));
    }

    //Query the state of user's for a given company
    async queryClientsByCompany(stub, args, thisClass) {
        console.info('============= START : Query Client By Company ===========');

        if (args.length != 1) {
            throw new Error('Número incorrecto de argumentos, espero nombre de la compañia');
        }

        let company = args[0];

        let companyState = await stub.getState(company);
        if (!companyState || !companyState.toString()) {
            throw new Error(`No existe este el nombre de esa compañia: ${company}`);
        }

        let val1 = JSON.parse(companyState.toString());
        delete val1.doctype;
        const comp = new Company(val1);

        console.info('============= END : Query Client By Company ===========');

        const list = comp.getStatusList();

        let method = thisClass['queryClient'];
        for(let i=0;i<list.approved.length;i++){
            let result = await method(stub, [list.approved[i].client], thisClass);
            list.approved[i].client = JSON.parse(result.toString('utf8'))
        }

        let info = {approved: list.approved, rejected: list.rejected, waiting: list.waiting};

        return Buffer.from(JSON.stringify(info));
    }

    //Query the state of a company's for a given user
    async queryCompaniesByClient(stub, args, thisClass) {
        console.info('============= START : Query Company By Client ===========');

        if (args.length != 1) {
            throw new Error('Número incorrecto de argumentos, espero RFC del cliente');
        }

        let client = args[0];

        let clientState = await stub.getState(client);
        if (!clientState || !clientState.toString()) {
            throw new Error(`No existe este el RFC de ese cliente: ${client}`);
        }

        let val1 = JSON.parse(clientState.toString());
        delete val1.doctype;
        const comp = new Client(val1);

        console.info('============= END : Query Client By Company ===========');
        return Buffer.from(JSON.stringify(comp.getStatusList()));
    }

    //Get client by a attribute
    public async queryClientByAttributes(stub, args, thisClass) {
        console.info('============= START : Query Client by Attributes ===========');

        if (args.length < 1) {
            throw new Error('Incorrect number of arguments. Expecting owner name.')
        }

        let queryString = null;

        try {
            queryString = {selector: new Properties(JSON.parse(args[0]))};
        } catch (err) {
            throw new Error('El string no esta en formato JSON');
        }

        let method = thisClass['getQueryResultForQueryString'];
        console.info('============= END : Query Client by Attributes ===========');
        return await method(stub, JSON.stringify(queryString), thisClass);
    }

    //Interanal method used queryClientByAttributes
    async getQueryResultForQueryString(stub, queryString, thisClass) {

        let resultsIterator = await stub.getQueryResult(queryString);
        let method = thisClass['getAllResults'];

        let results = await method(resultsIterator, false);

        return Buffer.from(JSON.stringify(results));
    }

    //Iterate a prettify a given iterator
    private async getAllResults(iterator, isHistory) {
        let allResults = [];
        while (true) {
            let res = await iterator.next();

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
                    } catch (err) {
                        console.info(err);
                        jsonRes["Value"] = res.value.value.toString('utf8');
                    }
                } else {
                    jsonRes["Key"] = res.value.key;
                    try {
                        const json = JSON.parse(res.value.value.toString('utf8'));
                        delete json.password;
                        delete json.isHashed;
                        delete json.aprobaciones;
                        jsonRes["Value"] = json;
                    } catch (err) {
                        console.info(err);
                        jsonRes["Record"] = res.value.value.toString('utf8');
                    }
                }
                allResults.push(jsonRes);
            }
            if (res.done) {
                await iterator.close();
                console.info(allResults);
                return allResults;
            }
        }
    }
};

export default Chaincode;