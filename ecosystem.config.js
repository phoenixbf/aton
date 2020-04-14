module.exports = {

  apps: [
    // Content service
    {
      name      : 'Content Service',
      script    : 'services/ATON.SERVICE.content.js',
      instances : 'max',
      exec_mode : 'cluster',
    },

    // VRoadcast service
    {
      name      : 'VRoadcast Service',
      script    : 'services/ATON.SERVICE.vroadcast.js',
      instances : 1,
      exec_mode : 'cluster'
    }
  ]
};
