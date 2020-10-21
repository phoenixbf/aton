module.exports = {

  apps: [
    // Content service
    {
      name         : 'ATON Main Service',
      script       : 'ATON.service.main.js',
      instances    : 'max',
      exec_mode    : 'cluster',
      watch        : true,
      ignore_watch : ["sessions"]
    },

    // VRoadcast service
    {
      name         : 'ATON VRoadcast Service',
      script       : 'ATON.service.vroadcast.js',
      instances    : 1,
      exec_mode    : 'cluster',
      watch        : true,
      ignore_watch : ["sessions"]
    },

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
