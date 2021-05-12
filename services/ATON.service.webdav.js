/*!
    @preserve

 	ATON WebDav Service

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/

const app    = require('express')();
const cors   = require('cors');
const webdav = require('webdav-server').v2;
const fs     = require('fs');

const Core = require('./Core.js');

// Initialize & load config files
Core.init();

let PORT_WEBDAV = 8081;
if (Core.config.services.webdav && Core.config.services.webdav.PORT) PORT_WEBDAV = Core.config.services.webdav.PORT;


// User manager (tells who are the users)
let userManager = new webdav.SimpleUserManager();

// Privilege manager (tells which users can access which files/folders)
let privilegeManager = new webdav.SimplePathPrivilegeManager();

for (let u in Core.users){
    let dbuser = Core.users[u];
    if (dbuser){
        let uname  = dbuser.username;
        let bAdmin = dbuser.admin;

        let user = userManager.addUser(uname, dbuser.password, bAdmin);
        //privilegeManager.setRights(user, '/collection', ['canReadProperties']);
        //privilegeManager.setRights(user, '/scenes', ['canReadProperties']);

        //privilegeManager.setRights(user, "/", [ 'canRead' ]);
        //privilegeManager.setRights(user, "/"+uname+"/", [ 'canRead' ]);
/*
        privilegeManager.setRights(user, "/"+uname+"/", [ 'canRead' ]);
        privilegeManager.setRights(user, "/"+uname+"/collection/", [ 'all' ]);
        privilegeManager.setRights(user, "/"+uname+"/scenes/", [ 'all' ]);
*/      
        privilegeManager.setRights(user, "/"+uname+"-collection/", [ 'all' ]);
        privilegeManager.setRights(user, "/"+uname+"-scenes/", [ 'all' ]);

        if (bAdmin){
            privilegeManager.setRights(user, "/apps/", [ 'all' ]);
        }
        
        //privilegeManager.setRights(user, '/', [ 'all' ]);
        console.log(user);
    }
}

console.log(privilegeManager);

// Start service
const server = new webdav.WebDAVServer({
    httpAuthentication: new webdav.HTTPDigestAuthentication(userManager, 'ATON'),
    privilegeManager: privilegeManager,
    port: PORT_WEBDAV
});

// link physical fs
for (let u in Core.users){
    let dbuser = Core.users[u];
    let uname = dbuser.username;

    let upathCollection = Core.DIR_COLLECTIONS + uname + "/";
    let upathScenes     = Core.DIR_SCENES + uname + "/";

    if (fs.existsSync(upathCollection)){
        server.setFileSystemSync("/"+uname+"-collection", new webdav.PhysicalFileSystem(upathCollection));
    }
    if (fs.existsSync(upathScenes)){
        server.setFileSystemSync("/"+uname+"-scenes", new webdav.PhysicalFileSystem(upathScenes));
    }
}

// Access to web-apps
server.setFileSystemSync("/apps", new webdav.PhysicalFileSystem(Core.DIR_WAPPS));


//server.setFileSystemSync('/collection', new webdav.PhysicalFileSystem(Core.DIR_COLLECTIONS));
//server.setFileSystemSync('/scenes', new webdav.PhysicalFileSystem(Core.DIR_SCENES));

/*
server.setFileSystem('/',new webdav.VirtualFileSystem(new webdav.VirtualSerializer()));

//console.log(server);
*/

// Logging
/*
server.afterRequest((arg, next) => {
    // Display the method, the URI, the returned status code and the returned message
    console.log('>>', arg.request.method, arg.requested.uri, '>', arg.response.statusCode, arg.response.statusMessage);
    // If available, display the body of the response
    console.log(arg.responseBody);
    next();
});
*/

// Mount the WebDAVServer instance
//app.use(cors({credentials: true, origin: true}));
//app.use(webdav.extensions.express("/wd", server));
//app.listen(PORT_WEBDAV); // Start the Express server

server.start(() => {
    console.log('WebDav service started on PORT: '+PORT_WEBDAV);
});