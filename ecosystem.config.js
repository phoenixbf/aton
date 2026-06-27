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
      //max_memory_restart: "400M",
      restart_delay : 1000,
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
      //max_memory_restart: "400M",
      restart_delay : 1000,
      //out_file     : "./logs/ATON.service.photon.log",
      env: {
        "NODE_ENV" : "production",
      }
    },

    // Anuket service
    {
      name          : 'ATON Anuket Service',
      script        : 'services/anuket/ATON.service.anuket.js',
      instances     : 1,
      exec_mode     : 'cluster',
      watch         : ["services","config"],
      ignore_watch  : ["config/flares"],
      merge_logs    : true,
      //max_memory_restart: "400M",
      restart_delay : 1000,
      //out_file     : "./logs/ATON.service.anuket.log",
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
      //max_memory_restart: "200M",
      restart_delay : 1000,
      //out_file     : "./logs/ATON.service.webdav.log",
      env: {
        "NODE_ENV" : "production",
      }
    },
  ]
};
