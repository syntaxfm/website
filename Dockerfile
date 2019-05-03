FROM mhart/alpine-node:10.15

# Create directories all the way up to app
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

# force production when built from Docker
ENV NODE_ENV production

# build
RUN npm run build
EXPOSE 6969

CMD [ "node", "server.js" ]
