var vault = require("node-vault");
var Base64 = require('js-base64').Base64;
var mysql = require("promise-mysql");
var cv = require("../cryptvault/index");
var vault = new cv.CryptVault('http://localhost:8237', 'e6ee45d1-5085-1605-67fe-077d15e74041');
mysql.createConnection({
    host: 'localhost',
    user: 'world',
    password: 'Spain',
    database: 'world'
}).then(function (connection) {
    connection.query('SELECT id, Name, Name_Encrypted FROM City LIMIT 100;')
        .then(function (rows, fields) {
        var newRows = rows.map(function (row) {
            console.log(row.Name, row.Name_Encrypted);
            return vault.encrypt('world', row.Name)
                .then(function (cipherText) {
                console.log(cipherText);
                return connection.query('UPDATE City SET Name_Encrypted="' + cipherText + '" WHERE id=' + row.id)
                    .then(function (resp) {
                    console.log("UPDATE RESP", resp.message);
                    return { id: row.id, name: row.Name, cipher: cipherText };
                })
                    .catch(function (err) {
                    console.log("Error updating db:");
                    throw err;
                });
            })
                .catch(function (err) {
                console.log("ERR:", err.message);
            });
        });
        return Q.Promise.all(newRows);
    })
        .catch(function (err) {
        if (err.code == 'ER_BAD_FIELD_ERROR') {
            console.log("Add new column with: ALTER TABLE City ADD Name_Encrypted varchar(70);");
        }
        throw err;
    })
        .then(function () {
        return connection.query("SELECT Name, Name_Encrypted FROM City LIMIT 100;").then(function (rows) {
            rows.forEach(function (row) {
                console.log(row.Name, ':', (row.Name_Encrypted && row.Name_Encrypted.slice(0, 6) == 'vault:') ?
                    vault.decryptSync('world', row.Name_Encrypted) :
                    row.Name_Encrypted);
            });
        });
    })
        .finally(function () {
        process.exit();
    });
});
//# sourceMappingURL=vault.js.map