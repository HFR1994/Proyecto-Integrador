var express = require('express');
var stream = require('stream');
var crypto = require('crypto');
var router = express.Router();
var aes256 = require("aes256");
var MessageHandler = require("../bin/MessageHandler");

router.post("/request/access", function (req,res,next) {

    const blockchain = req.app.locals.blockchainHandler;
    const client = req.body.client;
    const company = req.body.company;

    if (client && company) {
        blockchain.addClientCompany(client, company).then((e) => {
            res.send(e.toObject())
        })
    }else{
        handler = new MessageHandler.default(400, "Los paramteros esperados son client y company");
        res.send(handler.toObject());
    }
});

router.post("/register", function (req,res,next) {

    const blockchain = req.app.locals.blockchainHandler;
    const id = req.body.id;
    const company = req.body.company;

    if (id && company) {
        blockchain.registerCompany(id, company).then((e) => {
            res.send(e.toObject())
        })
    }else{
        handler = new MessageHandler.default(400, "Los paramteros de id y company son obligatorios");
        res.send(handler.toObject());
    }
});

router.post("/login", function (req,res,next) {

    const blockchain = req.app.locals.blockchainHandler;
    const user = req.body.user;
    const password = req.body.password;

    if (user && password) {
        blockchain.loginCompany(user, password).then((e) => {
            res.send(e.toObject())
        })
    }else{
        handler = new MessageHandler.default(400, "Los paramteros de user y password son obligatorios");
        res.send(handler.toObject());
    }
});


router.post("/register/data", function (req,res,next) {
    const blockchain = req.app.locals.blockchainHandler;
    const client = req.body.client;
    const company = req.body.company;
    const data = req.body.data;

    if (client && company && data) {
        respon = JSON.parse(JSON.stringify(data));
        if(typeof respon === "object") {
            blockchain.addCompany(client, company, JSON.stringify(data)).then((e) => {
                res.send(e.toObject())
            })
        }else{
            handler = new MessageHandler.default(400, "Data debe estar en formato JSON ");
            res.send(handler.toObject());
        }
    }else{
        handler = new MessageHandler.default(400, "Los paramteros esperados son client, company y data");
        res.send(handler.toObject());
    }
});

router.get("/:id/clients", function (req,res,next) {

    const blockchain = req.app.locals.blockchainHandler;
    const id = req.params.id;

    if (id) {
        blockchain.queryClientByCompany(id).then((e) => {
            res.send(e.toObject())
        });
    }else{
        handler = new MessageHandler.default(400, "Los parametros esperados son id");
        res.send(handler.toObject());
    }
});


router.get("/:id/client/:rfc", function (req,res,next) {

    const blockchain = req.app.locals.blockchainHandler;
    const id = req.params.id;
    const rfc = req.params.rfc;

    if (id && rfc) {
        blockchain.isClientOnCompany(rfc, id).then((f) => {
            if(f){
                blockchain.queryClient(rfc).then((e) => {
                    res.send(e.toObject())
                });
            }else{
                handler = new MessageHandler.default(400, "No tienes permiso de ver a este cliente");
                res.send(handler.toObject());
            }

        });
    }else{
        handler = new MessageHandler.default(400, "Los parametros esperados son id y rfc");
        res.send(handler.toObject());
    }
});
module.exports = router;
