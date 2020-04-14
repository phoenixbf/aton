@echo off

forever start services/ATON.SERVICE.atonizer.js && pm2 start ecosystem.config.js
