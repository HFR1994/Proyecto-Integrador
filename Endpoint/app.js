var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var BlockchainService = require("./bin/BlockchainService");
var cors = require('cors');

var clientRouter = require('./routes/client');
var companyRouter = require('./routes/company');

var app = express();

const blockchain = new BlockchainService.BlockchainService();
blockchain.initializeConnection().then((e) =>{
  return e
}).then((data) => {
    app.locals.blockchainHandler = blockchain;
    console.log("Listo escucho en el puerto localhost:3000");
}).catch((err) => {
    console.error(err);
    console.log("No me puedo conectar con el Blockchain")
});

app.use(cors());
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/client', clientRouter);
app.use('/company', companyRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
