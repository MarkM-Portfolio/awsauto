var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');

const fs = require('fs');
const basicAuth = require('express-basic-auth');

var app = express();
var bodyParser = require('body-parser');


function checkAuth(username, password, callback) {
  file_path = path.join(__dirname, 'icautomation-token')

  fs.readFile(file_path, 'utf8', function(err, data){
    if (err) throw err;
    const token = data.toString().trim();
    if (basicAuth.safeCompare(password, token)) {
        callback(null, true);
    } else {
        callback(null, false);
    }
  });
}


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); 

//app.use(bodyParser);
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: false })); // support encoded bodies

app.use(basicAuth({authorizer: checkAuth, authorizeAsync: true}));
app.use('/', indexRouter);

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
