var express = require('express');
var stream = require('stream');
var crypto = require('crypto');
var router = express.Router();
var aes256 = require("aes256");
var MessageHandler = require("../bin/MessageHandler");

router.post("/register", function (req,res,next) {

    const blockchain = req.app.locals.blockchainHandler;
    const id = req.body.id;
    const user = req.body.user;

    if (id && user) {
        blockchain.registerClient(req.body.id, req.body.user).then((e) => {
            res.send(e.toObject())
        })
    }else{
        handler = new MessageHandler.default(400, "Los paramteros de id y user son obligatorios");
        res.send(handler.toObject());
    }

});

router.post("/login", function (req,res,next) {

    const blockchain = req.app.locals.blockchainHandler;
    const user = req.body.user;
    const password = req.body.password;

    if (user && password) {
        blockchain.loginUser(user, password).then((e) => {
            res.send(e.toObject())
        })
    }else{
        handler = new MessageHandler.default(400, "Los paramteros de user y password son obligatorios");
        res.send(handler.toObject());
    }
});

router.post("/aprove/company", function (req,res,next) {
    const blockchain = req.app.locals.blockchainHandler;
    const client = req.body.client;
    const company = req.body.company;
    const response = req.body.aprove.toString();

    if (client && company && response) {
        blockchain.aproveCompany(client, company, response).then((e) => {
            res.send(e.toObject())
        })
    }else{
        handler = new MessageHandler.default(400, "Los paramteros de client, company y aprove");
        res.send(handler.toObject());
    }
});

router.get("/:id", function (req,res,next) {

    const blockchain = req.app.locals.blockchainHandler;
    const id = req.params.id;

    if (id) {
        blockchain.queryClient(id).then((e) => {
            res.send(e.toObject())
        });
    }else{
        handler = new MessageHandler.default(400, "Los parametros esperados son /queryClient/:id");
        res.send(handler.toObject());
    }

});

router.get("/:id/history", function (req,res,next) {

    const blockchain = req.app.locals.blockchainHandler;
    const id = req.params.id;

    if (id) {
        blockchain.queryClientByHistory(id).then((e) => {
            res.send(e.toObject())
        });

    }else{
        handler = new MessageHandler.default(400, "Los parametros esperados son /queryClient/:id");
        res.send(handler.toObject());
    }

});

router.get("/:id/companies", function (req,res,next) {

    const blockchain = req.app.locals.blockchainHandler;
    const id = req.params.id;

    if (id) {
        blockchain.queryCompaniesByClient(id).then((e) => {
            res.send(e.toObject())
        });
    }else{
        handler = new MessageHandler.default(400, "Los parametros esperados son id");
        res.send(handler.toObject());
    }
});

module.exports = router;
