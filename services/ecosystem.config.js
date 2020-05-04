module.exports = {

  apps: [
    // Content service
    {
      name      : 'ATON Content Service',
      script    : 'ATON.SERVICE.content.js',
      instances : 'max',
      exec_mode : 'cluster',
      watch     : true
    },

    // VRoadcast service
    {
      name      : 'ATON VRoadcast Service',
      script    : 'ATON.SERVICE.vroadcast.js',
      instances : 1,
      exec_mode : 'cluster',
      watch     : true
    },

    // Atonizer
    {
      name      : 'ATONIZER Service',
      script    : 'ATON.SERVICE.atonizer.js',
      instances : 1,
      exec_mode : 'fork',
      watch     : true
    }
  ]
};
