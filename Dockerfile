FROM node:16

# Create main ATON folder
WORKDIR /aton

# Install app dependencies
COPY package*.json ./

RUN npm install
RUN npm install pm2 -g

# Bundle app source
COPY . .

#EXPOSE 8080

# Single
#CMD [ "node", "services/ATON.service.main.js" ]

# PM2
CMD ["pm2-runtime", "ecosystem.config.js"]
#CMD ["pm2-runtime", "ecosystem.config.js", "--only", "APP"]
