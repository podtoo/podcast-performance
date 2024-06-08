# Using the `/token` Endpoint for Non-Admin Token

The `/token` endpoint in the Podcast Performance Server is used to generate a Non-Admin Token. This token is essential for your podcast XML feed to generate user sessions to store Podcast Performance data, submit polls, Q&As, and use other tools. This document provides a step-by-step guide on how to use this endpoint.

## Endpoint Overview

- **URL**: `/token`
- **Method**: GET
- **Query Parameters**:
  - `expiresIn` (optional)
- **Response**: JSON object containing the generated token

## Prerequisites

1. Ensure the `PERFORMANCE_SECRET_KEY` environment variable is set on your server in the `.env` file.

## Request

### Query Parameters

- **expiresIn** (optional): The expiration time for the token. If not provided, the default value from the `.env` environment variable `EXPIRES_IN` will be used.

### Example cURL Request

```sh
curl --location --request GET 'http://localhost:7000/token' \
--data-urlencode 'expiresIn=2h'
```

### Sample cURL Request

```sh
curl --location --request GET 'http://localhost:7000/token' \
```

## Response

The response will be a JSON object containing the following property:

- `token`: The generated Non-Admin Token.

### Example Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzIjoibHd1czh6NnAtZDYyNjBhN2RkYmIwODZlNCIsImQiOiIxIiwiYSI6dHJ1ZSwiaWF0IjoxNzE3MTY1OTE0LCJleHAiOjE3MTcxNjk1MTR9.eUTxAjLJ8NcP_I-mNgVAlUyQSJpSIuuQBNz6wDiYcXM"
}
```

## Error Handling

The endpoint may return various HTTP status codes to indicate errors:

- `500 Internal Server Error`: Secret key not configured or error generating the token.
- `400 Bad Request`: Invalid public key.

### Example Error Response

```json
{
  "error": "Secret key not configured"
}
```

## Usage of Non-Admin Token

This Non-Admin Token is used in your podcast XML feed for the following purposes:

1. **Generate User Sessions**: Store Podcast Performance data.
2. **Submit Polls**: Allow users to participate in polls related to the podcast.
3. **Submit Q&As**: Enable users to submit questions and answers.
4. **Access Other Tools**: Utilize additional tools provided by the Podcast Performance Server.

## Implementation Details

The `/token` endpoint performs the following tasks:

1. **Secret Key Verification**: Ensures the `PERFORMANCE_SECRET_KEY` environment variable is configured.
2. **Payload Construction**: Constructs the payload for the token with a unique identifier and expiration time.
3. **Public Key Validation** (optional): If a public key is provided, it adds an additional property to the payload and ensures the expiration time is not overridden.
4. **Token Generation**: Signs the payload with the secret key to generate the token.
5. **Token Saving**: Saves the generated token in the database.
6. **Response**: Returns the generated token in a JSON format.


By following this guide, you should be able to successfully generate a Non-Admin Token using the `/token` endpoint, which can be used in your podcast XML feed to generate user sessions, submit polls, Q&As, and utilize other tools.