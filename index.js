'use strict';

const _ = require('underscore'); //Sólamente para tener algunas herramientas más para desarrollar
const restify = require('restify'); //framework REST
const redis = require("./lib/redis"); //Manipulador de la conexión de la BD
const auth = require("./lib/auth"); //Librería para manejar la autenticación
const app = restify.createServer();
const redisDB = new redis({"host": "localhost","port": 6379}); //Conecto a Redis
const authJWT = new auth(); 

//Utilizo una mysql para hacer las pruebas
const mysql = require("./lib/mysql");
const mysqlDB = new mysql({host: 'localhost',user: 'root',password : 'root',database : 'pruebaZetech'});

app.use(restify.bodyParser()); // Para parsear parámetros del tipo application/json


app.get('/user', authJWT.ensureAuthenticated, function(req, res, next) {
	console.log('Request URL: '+req.method+' /user');
	redisDB
		.get('auth:'+req.token)
		.then(
			(result)=> {
				// console.log(result,JSON.parse(result))
				if(!result) {
					res.json({"msg":"No se encuentran usuarios"})
				}
				res.json(result)
			}
		, 	(err) => {
				res.end("No hay nada")
			}
		);
});

//Esta acción la voy a usar como ejemplo para guardar logs de actividad de usuarios
app.post('/loguser', authJWT.ensureAuthenticated, function(req, res, next) {
	console.log('Request URL: /user');
	// var authHeader = req.headers.authorization.split(" ")
	console.log(req.body)
	var payload = authJWT.getPayload(req.token)
	redisDB
		.set('loguser:'+payload.id,JSON.stringify({ip:"127.0.0.1","accion":req.body.accion,time:Date.now()}))
		.then(
			(result)=> {
				console.log(result,JSON.parse(result))
				if(!result) {
					res.json({"msg":"No se encuentran usuarios"})
				}
				res.json(result)
			}
		, 	(err) => {
				res.end("No hay nada")
			}
		);
});

app.post('/auth', function(req, res, next) {
	mysqlDB
		.login(req.body)
		.then((result) => {
			if(result.length > 0) {
				//Capturo el token
				var token = authJWT.generateToken(result[0]);
				// Guardo en Redis la sesión
				// TODO: implementar el log de usuario
				// console.log(JSON.stringify(authJWT.getPayload(token)))
				var payload = authJWT.getPayload(token)
				redisDB
					.set('auth:'+token, JSON.stringify(payload))
					.then(
						() => {
							redisDB
								.sad('loguser:'+payload.id,JSON.stringify({ip:"127.0.0.1","accion":"Ingreso",time:Date.now()}))
								.then(
									(result)=> {
										console.log("LogUser ingreso")
									}
								, 	(err) => {
										console.log("error al registrar al LogUser ingreso")
									}
								);

							res.json({"jwt": token, "msg": "Succesfully"});	
						}
					,	(err) => {
							res.statusCode = 401
							res.json({"msg":"Error al manipular la sesión, vuelva a loguearse"})
						}
					);	
			} else {
				res.statusCode = 401
				res.json({"msg":"Nombre de usuario o contraseña incorrecto"})
			}
		},(err) => {
			res.statusCode = 401
			res.json({"msg":"Nombre de usuario o contraseña incorrecto"})
		})
});

app.get('/loguser/:id', function(req, res, next) {
	console.log('Request URL: '+req.method+' /loguser/'+req.params.id);
	redisDB
		.smembers('loguser:'+req.params.id)
		.then(
			(result)=> {
				// console.log(result,JSON.parse(result))
				if(!result) {
					res.json({"msg":"No se encuentran logs de usuarios"})
				}
				res.json(result)
			}
		, 	(err) => {
				res.end("Hubo un error en la consulta...")
			}
		);
});

app.listen(3000, () => {
  	console.log('Server escuchando el puerto 3000 al server %s',app.url);
});
