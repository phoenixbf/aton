/*!
    @preserve

 	ATON Authentication middleware

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/


let bodyParser = require('body-parser');

let passport = require('passport');
let Strategy = require('passport-local').Strategy;
const cookieParser   = require('cookie-parser');
const session        = require('express-session');
const FileStore      = require('session-file-store')(session);



let Auth = {};

Core.Auth     = Auth;
Core.passport = passport;



Auth.init = (app)=>{
    Auth.setupPassport();

	let fileStoreOptions = {
		fileExtension: ".ses"
	};

	let bodyParser = require('body-parser');
	app.use(bodyParser.json({ limit: '50mb' }));
	app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

	//app.use(require('body-parser').urlencoded({ extended: true }));
	
	app.use( cookieParser() );
	app.use(
		session({ 
			secret: 'shu',
			//cookie: { maxAge: 1800000 }, // 60000 = 1 min
			resave: true, 
			saveUninitialized: true,
			//rolling: true
			store: new FileStore(fileStoreOptions)	// required for consistency in cluster mode
		})
	);

	// Initialize Passport and restore authentication state, if any, from the session
    app.use(passport.initialize());
    app.use(passport.session());
};

Auth.setupPassport = ()=>{

    passport.use( new Strategy((username, password, cb)=>{
        Auth._findByUsername(username, function(err, user) {
            if (err) return cb(err);
            if (!user) return cb(null, false);
            if (user.password != password) return cb(null, false);

            return cb(null, user);
        });
    }));

    passport.serializeUser((user, cb)=>{
        cb(null, Core.users.indexOf(user));
    });

    passport.deserializeUser((id, cb)=>{
        Auth._findById(id, (err, user)=>{
            if (err) return cb(err);

            cb(null, user);
        });
    });
};

// Passport utility
Auth._findByUsername = (username, cb)=>{
	process.nextTick( function(){
		// Load
		Core.users = Core.Maat.getUsers(); //Core.loadConfigFile("users.json", Core.CONF_USERS);

        let numUsers = Core.users.length;

		for (let i = 0; i < numUsers; i++){
			let U = Core.users[i];

			if (U.username === username) return cb(null, U);
		}

	return cb(null, null);
	});
};

// Passport utility
Auth._findById = (id, cb)=>{
	process.nextTick(()=>{
		Core.users = Core.Maat.getUsers(); //Core.loadConfigFile("users.json", Core.CONF_USERS);

		if (Core.users[id]) cb(null, Core.users[id]);
		else cb( new Error('User ' + id + ' does not exist') );
	});
};

Auth.findUser = (username)=>{
	for (let i in Core.users){
		let U = Core.users[i];
		if (U.username === username) return U;
	}

	return undefined;
};

// Unique user ID
Auth.getUID = (req)=>{
	if (!req.user) return undefined;
	return req.user.username;
};

Auth.isUserAuth = (req, username)=>{
    if (req.user === undefined) return false;
    if (req.user.username === undefined) return false;

	if (username && req.user.username!==username) return false;

    return true;
};

Auth.isUserAdmin = (req)=>{
    if ( !Auth.isUserAuth(req) ) return false;
	let u = req.user;

	if (u.admin /*|| (u.roles && u.roles.admin)*/) return true;
    else return false;
};

module.exports = Auth;