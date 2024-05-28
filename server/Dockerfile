# Use the Node.js Alpine image as the base image
FROM node:alpine

# Set the working directory
WORKDIR /usr/app


# Copy "package.json" and "package-lock.json" before other files
# Utilize Docker cache to save re-installing dependencies if unchanged
COPY package*.json ./

# Install dependencies
RUN npm install

# Install ffmpeg
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
