module.exports = {

  apps: [
    // Content service
    {
      name         : 'ATON Main Service',
      script       : 'services/ATON.service.main.js',
      instances    : 'max',
      exec_mode    : 'cluster',
      watch        : ["services"]
    },

    // VRoadcast service
    {
      name         : 'ATON VRoadcast Service',
      script       : 'services/ATON.service.vroadcast.js',
      instances    : 1,
      exec_mode    : 'cluster',
      watch        : ["services"]
    },

      // WebDav service
    {
      name         : 'ATON WebDav Service',
      script       : 'services/ATON.service.webdav.js',
      instances    : 1,
      exec_mode    : 'cluster',
      watch        : ["services", "config"]
    }

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
