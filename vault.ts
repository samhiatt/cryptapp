//var Vaulted = require("vaultec");
var vault = require("node-vault");
var Base64 = require('js-base64').Base64;
var mysql = require("promise-mysql");
var cv = require("../cryptvault/index");

var vault = new cv.CryptVault('http://localhost:8237','e6ee45d1-5085-1605-67fe-077d15e74041');

mysql.createConnection({
	host:'localhost',
	user:'world',
	password:'Spain',
	database:'world'
}).then((connection)=>{
	connection.query('SELECT id, Name, Name_Encrypted FROM City LIMIT 100;')
		.then((rows,fields)=>{
			var newRows = rows.map(function(row){
				console.log(row.Name,row.Name_Encrypted);
				return vault.encrypt('world',row.Name)
				.then((cipherText)=> {
					console.log(cipherText);
					return connection.query('UPDATE City SET Name_Encrypted="'+cipherText+'" WHERE id=' + row.id)
						.then((resp)=> {
							console.log("UPDATE RESP", resp.message);
							return {id:row.id,name:row.Name,cipher:cipherText};
						})
						.catch((err)=>{
							console.log("Error updating db:");
							throw err;
						})
					;
				})
				.catch((err)=>{
					console.log("ERR:",err.message);
				});
			});
			return Q.Promise.all(newRows);
		})
		.catch((err)=>{
			if (err.code=='ER_BAD_FIELD_ERROR') {
				console.log("Add new column with: ALTER TABLE City ADD Name_Encrypted varchar(70);");
			}
			throw err;
		})
		.then(()=>{
			return connection.query("SELECT Name, Name_Encrypted FROM City LIMIT 100;").then((rows)=>{
				rows.forEach((row)=>{
					console.log(row.Name, ':', 
						(row.Name_Encrypted && row.Name_Encrypted.slice(0,6)=='vault:')? 
							vault.decryptSync('world', row.Name_Encrypted) : 
							row.Name_Encrypted
					);
				})
			});
		})
		.finally(()=>{
			process.exit();
		});
});


//connection.query('SELECT * FROM City LIMIT 10;', function(err,rows,fields){
//	if (err) throw err;
//	rows.forEach(function(row){
//		console.log(row);
//	});
//});

//var vault = new Vaulted({
//  vault_host:"127.0.0.1",
//  vault_port:8237,
//  vault_ssl:0,
//  backup_dir:".creds",
//  secret_shares: 5,
//  secret_threshold: 3
//});

//vault.getInitStatus().bind(vault)
//  .then(function(status){
//    console.log("Init status:",status);
//    if (status.initialized) return this.prepare()
//      .then(function(){
//        console.log("Loaded state from backup dir:" + this.config._def.backup_dir.default);
//        return this;
//      })
//      .catch(function(err){
//        console.error("Error leading state from backup dir:"+require('path').join(__dirname,this.backup_dir));
//        throw err;
//      });
//    else return this.init().then(function(){
//      console.log("New vault initialized.");
//      return this;
//    });
//  })
//  .then(vault.getSealedStatus)
//  .then(function(response){
//    console.log("sealed status:", response.status);
//    if (response.status.sealed) 
//      return this.unSeal().then(function(){
//        console.log("Unsealed.");
//      })
//      .catch(function(err){
//        console.log("Error unsealing vault");
//        throw err;
//      });
//    else return this;
//  })
//  .then(function(){
//    console.log("Ready.");
//    return vault.getLeader().then(function(resp){
//      console.log("Leader", resp);
//    })
//  })
//  .catch(function(err){
//    console.log(err)
//  });

