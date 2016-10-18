const jwt = require('jsonwebtoken'); //jsonwebtoken import
const config = require('./config');

function Auth() {
}

Auth.prototype.generateToken = function(toSign) {
	return jwt.sign(
		{id: toSign.id, username: toSign.username, exp: (Date.now() + config.TTL)}
	, 	config.TOKEN_SECRET
	);
}

Auth.prototype.getPayload = function(token) {
	return jwt.decode(token, config.TOKEN_SECRET);
}

Auth.prototype.ensureAuthenticated = function(req, res, next) {
	if(!req.headers.authorization) {
		res.statusCode = 403
		res.json({message: "Tu petición no tiene cabecera de autorización"});
	}
	try {
		var token = req.headers.authorization.split(" ");
		var payload = jwt.verify(token[1], config.TOKEN_SECRET);
		
		if(!payload) {
			res.statusCode = 401
			res.json({message: "Tu petición no presenta un token correcto"});	
		}

		var timeInMs = Date.now();
		// console.log("Tiempos de expiración",payload.exp, timeInMs)
		if(payload.exp <= timeInMs) {
			res.statusCode = 401
			res.json({message: "El token ha expirado"});
		}

		req.payload = payload;
		req.token = token[1];
		next();
	} catch(err) {
		//Se puede registrar los intentos de acceso de jwt defectuosos
		console.log("Error verificando el jwt...")
		res.statusCode = 401
		res.json({message: "Error al validar el token"});
	}
}

module.exports = Auth
