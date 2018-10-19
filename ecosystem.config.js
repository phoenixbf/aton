module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [

    // First application
    {
      name      : 'content',
      script    : 'services/ATON.SERVICE.content.js',
      instances : 'max',
      exec_mode : 'cluster',

      env: {
        COMMON_VARIABLE: 'true'
      },
      env_production : {
        NODE_ENV: 'production'
      }
    },

    // Second application
    {
      name      : 'collab',
      script    : 'services/ATON.SERVICE.vroadcast.js',
      instances : 1,
      exec_mode : 'cluster'
    }
  ]
};
