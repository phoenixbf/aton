module.exports = {

  apps: [
    // Main service (gateway)
    {
      name          : 'ATON Main Service',
      script        : 'services/ATON.service.main.js',
      instances     : 'max',
      exec_mode     : 'cluster',
      watch         : ["services","config"],
      ignore_watch  : ["config/flares"], 
      instance_var  : 'INSTANCE_ID',
      merge_logs    : true,
      //restart_delay : 1000,
      //out_file     : "./logs/ATON.service.main.log",
      env: {
        "NODE_ENV" : "production",
      }
    },

    // Photon service
    {
      name          : 'ATON Photon Service',
      script        : 'services/photon/ATON.service.photon.js',
      instances     : 1,
      exec_mode     : 'cluster',
      watch         : ["services","config"],
      ignore_watch  : ["config/flares"],
      merge_logs    : true,
      //restart_delay : 1000,
      //out_file     : "./logs/ATON.service.photon.log",
      env: {
        "NODE_ENV" : "production",
      }
    },

    // WebDav service
    {
      name          : 'ATON WebDav Service',
      script        : 'services/webdav/ATON.service.webdav.js',
      instances     : 1,
      exec_mode     : 'cluster',
      watch         : ["services", "config"],
      ignore_watch  : ["config/flares"],
      merge_logs    : true,
      //restart_delay : 1000,
      //out_file     : "./logs/ATON.service.webdav.log",
      env: {
        "NODE_ENV" : "production",
      }
    },

    // Maat service
/*
    {
      name         : 'ATON Maat Service',
      script       : 'services/ATON.service.maat.js',
      instances    : 1,
      exec_mode    : 'cluster',
      watch        : ["services", "config"]
    }
*/
    // Atonizer
/*
    {
      name      : 'ATONIZER Service',
      script    : 'ATON.SERVICE.atonizer.js',
      instances : 1,
      exec_mode : 'fork',
      watch     : true
    }
*/
  ]
};
