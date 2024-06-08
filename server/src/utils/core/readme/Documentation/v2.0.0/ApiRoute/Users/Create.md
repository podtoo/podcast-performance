### Create a User API Documentation

## Endpoint

**POST** `/api/v2/users/create`

## Description

Creates a new user in the system. Requires an admin access token for authorization.

## Request Headers

- `Authorization: Bearer <admin_access_token>`
- `Content-Type: application/json`

## Request Body

The request body should be a JSON object containing the following fields:

- `name` (string): The name of the user.
- `username` (string): The username of the user.
- `email` (string): The email of the user.

Example **user** request body:

```json
{
  "name": "russell",
  "username": "russell",
  "email": "russell@radiomedia.com.au",
  "type": "user",
  "iconPic": {
    "type": "image/jpeg",
    "url": "https://storage.googleapis.com/cdn.podtoo.com/attachments/2030026158292553988_n.jpg"
  }
}
```

Example **group** request body - This is what you label a Podcast:

```json
{
  "name": "russell",
  "username": "russell",
  "email": "russell@radiomedia.com.au",
  "type": "group",
  "iconPic": {
    "type": "image/jpeg",
    "url": "https://storage.googleapis.com/cdn.podtoo.com/attachments/2030026158292553988_n.jpg"
  }
}
```

## Response

### Success (201 Created)

A successful response will include the following fields:

- `message` (string): A success message.
- `user_id` (string): The ID of the newly created user.
- `body.name` (string): The name of the user.
- `currentTime` (string): The current time in the server's timezone.

Example success response:

```json
{
    "message": "User created successfully",
    "user_id": "60d21b4667d0d8992e610c85",
    "body.name": "russell",
    "currentTime": "2024-06-03T11:36:57+08:00"
}
```

### Error Responses

- **400 Bad Request**: If any required fields are missing or the admin token is not sent.
  ```json
  {
      "error": "Name, username, email, and timezone are required"
  }
  ```

  ```json
  {
      "error": "Admin token not sent to server."
  }
  ```

- **401 Unauthorized**: If the token has expired.
  ```json
  {
      "error": "Token has expired"
  }
  ```

- **403 Forbidden**: If the token is invalid.
  ```json
  {
      "error": "Invalid token"
  }
  ```

- **409 Conflict**: If a user with the given username or email already exists.
  ```json
  {
      "error": "User with this username or email already exists"
  }
  ```

- **500 Internal Server Error**: If there is an error creating the user.
  ```json
  {
      "error": "Error creating user"
  }
  ```

## How to Use

1. Authorize with an Admin Access Token.
2. Send a POST request to `/api/v2/users/create` with the required headers and request body.

### Example cURL Command

```sh
curl --location --request POST 'https://YOUR_DOMAIN/api/v2/users/create' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzIjoibHd5ZTdwdzItNGI5ODY5YTRhZjA1NDI1MyIsImQiOiIzIiwiYSI6dHJ1ZSwiaWF0IjoxNzE3Mzg0MjA1LCJleHAiOjE3MTczOTUwMDV9.GUBFxBuwQn6P2aq4plpZBZAuB2LXi2BBNzrM1v4MG4M' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "russell",
    "username": "russellharrower",
    "email": "russell@example.com"
}'
```
