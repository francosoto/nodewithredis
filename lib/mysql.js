const mysql = require("mysql");
const _ = require('underscore');

function MySQL(connection){
    if(typeof connection=="undefined"){
        var config = {
			host     : 'localhost',
			user     : 'root',
			password : 'root',
			database : 'sgpp'
		}
    }else{
        var config = connection;
    }

    this.mysqlserver = mysql.createConnection(config);
}

MySQL.prototype.login = function(userParams) {
	var self = this 
	return new Promise(function(resolve, reject){
		self.mysqlserver.connect();
		if(_.isString(userParams.username) && _.isString(userParams.password)) {
			self.mysqlserver.query(
				'SELECT * FROM usuarios WHERE username = "' + userParams.username + '" AND password = md5(' + userParams.password + ')'
			, 	function(err, rows, fields) {

					if(err) 
						reject(array());
					else 
						resolve(rows);
				}
			);
			
			self.mysqlserver.end();
		}
		else {
			self.mysqlserver.end();
			reject(array());
		} 

    });
}

module.exports = MySQL;