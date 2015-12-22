var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var users = require('./routes/users');
var app = express();
var mysql = require("promise-mysql");
var cv = require("../cryptvault/index");
var Q = require('q');
app.use(function (req, res, next) {
    req.vault = new cv.CryptVault('http://localhost:8237', 'e6ee45d1-5085-1605-67fe-077d15e74041');
    next();
});
app.use(function (req, res, next) {
    mysql.createConnection({
        host: 'localhost',
        user: 'world',
        password: 'Spain',
        database: 'world'
    }).then(function (connection) {
        req.mysql_connection = connection;
        next();
    }).catch(function (err) {
        throw err;
    });
});
app.use('/cities', function (req, res) {
    mysql.createConnection({
        host: 'localhost',
        user: 'world',
        password: 'Spain',
        database: 'world'
    }).then(function (connection) {
        connection.query('SELECT id, Name, Name_Encrypted FROM City LIMIT 100;')
            .then(function (rows, fields) {
            var cities = [];
            var promises = rows.map(function (row) {
                return (row.Name_Encrypted && row.Name_Encrypted.slice(0, 6) == 'vault:') ?
                    req.vault.decrypt('world', row.Name_Encrypted).then(function (decrypted) {
                        cities.push({
                            decrypted: decrypted,
                            cipherText: row.Name_Encrypted
                        });
                    }).catch(function (err) {
                        throw err;
                    })
                    : Q.Promise.resolve(row.Name_Encrypted);
            });
            Q.Promise.all(promises).then(function () {
                res.render('index', {
                    cities: cities,
                    title: 'cities'
                });
            });
        })
            .catch(function (err) {
            res.send(err);
        });
    });
});
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);
app.use('/users', users);
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err['status'] = 404;
    next(err);
});
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
module.exports = app;
//# sourceMappingURL=app.js.map