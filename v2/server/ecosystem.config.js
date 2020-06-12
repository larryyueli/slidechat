module.exports = {
    apps : [{
      name: 'SlideChat',
      script: 'app.js',
      instances: 1,
      autorestart: true,
      watch: true,
      max_memory_restart: '4G',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
  
      error_file: '~/.slidechat/err.log',
      out_file: '~/.slidechat/out.log',
      time: true,
    }]
  };
  