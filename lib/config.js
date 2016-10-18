const fs = require('fs'); //filesystem

// var secret = fs.readFileSync('/var/certs/private.pem');

module.exports = {
	TOKEN_SECRET: fs.readFileSync('/var/certs/private.pem')
,	TTL : 600000 //10 minutos
}