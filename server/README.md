# Podcast-Performance/server

Podcast-Performance/server is our open-source code that allows anyone to host their own `<podcast:performance>` server and get key metrics of their episode data.

## Demo of Idea

You can view the source code for a JavaScript web-based player [here](https://codepen.io/redimongo/full/BaeQyaP).

## Demo of Server

As this is designed to only support the episode GUIDs in your database, we don't have an open demo server. However, we hope that this server code is easy to use and straightforward. Please comment on any issues you encounter.

## PLEASE RESPECT PEOPLES PRIVACY

As some of the community has pointed out, they don't want IP addresses stored. So I have added a middleware that currently Hashes the IP address and User-agent

## Server Code

Our server code supports the following technologies:
- MongoDB (Atlas or local)
- Crypto
- ExpressJS
- Docker

We do want to add more database types in the near future.

## How to Use

1. Clone the repository to your server.
2. Install `npm install` unless you are using our Docker script (also included).
3. When building use `npx tsc` and then to run `node dist/server.js`
3. Add a `.env` file to the folder with the following content:

```env
# Database type: 'mongodb', or 'firebase'
DB_TYPE=mongodb

# MongoDB Atlas
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority
MONGODB_DB=DATABSE

# Firebase - COMING SOON
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
```