### Getting Started
To use Podcast Performance on your own server you will need a few thing.

First make sure you have the latest .git repo from <a alt="GitHub Repo" href="https://github.com/podtoo/podcast-performance" target="_blank">GitHub</a>

### Set up your .env file
You will need to set up at the route of the server directory the following .env file

```env
DB_TYPE=mongodb
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@SERVER:PORT/?retryWrites=true&w=majority
MONGODB_DB=DATABASE_NAME
MONGODB_EPISODE_DB=Collection_Name
PERFORMANCE_SECRET_KEY=DON'T TELL ANYONE
PERFORMANCE_PUBLIC_KEY=THIS IS YOUR ADMIN PUBLIC KEY
EXPIRES_IN=1
```

If you have multiple collections that you store episodes in like PodToo does you can separate each collection with a `,` like this

```env
MONGODB_EPISODE_DB=Collection_Name_One,Collection_Name_Two
```

### Running using Docker
To use this with Docker we recommend your docker file be set up like this

Dockerfile
```sh
# Use the Node.js Alpine image as the base image
FROM node:alpine

# Set the working directory
WORKDIR /usr/app

# Copy "package.json" and "package-lock.json" before other files
# Utilize Docker cache to save re-installing dependencies if unchanged
COPY package*.json ./

# Install dependencies
RUN npm install

# apk update
RUN apk update

# Copy all files
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the listening port
EXPOSE 7000

# Run container as non-root (unprivileged) user
# The "node" user is provided in the Node.js Alpine base image
USER node

# Launch the app with Node.js, enabling ES Module support
CMD [ "node", "--experimental-modules", "dist/server.js" ]
```