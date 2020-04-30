module.exports = {

  apps: [
    // Content service
    {
      name      : 'Content Service',
      script    : 'ATON.SERVICE.content.js',
      instances : 'max',
      exec_mode : 'cluster',
      watch     : true
    },

    // VRoadcast service
    {
      name      : 'VRoadcast Service',
      script    : 'ATON.SERVICE.vroadcast.js',
      instances : 1,
      exec_mode : 'cluster',
      watch     : true
    },
    {
      name      : 'VRoadcast Service SSL',
      script    : 'ATON.SERVICE.vroadcast.js',
      args      : '--secure',
      instances : 1,
      exec_mode : 'cluster',
      watch     : true
    }
  ]
};
