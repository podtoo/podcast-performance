# Using the `/token` Endpoint

The `/token` endpoint in the Podcast Performance Server is used to generate a Podcast Performance Admin Token. This document provides a step-by-step guide on how to use this endpoint.

## Endpoint Overview

- **URL**: `/token`
- **Method**: GET
- **Headers**: 
  - `X-PUB-KEY` (required)
- **Response**: JSON object containing the generated token

## Prerequisites

1. Ensure the `PERFORMANCE_SECRET_KEY` environment variable is set on your server in the `.env.` file.

## Request

### Headers

- **X-PUB-KEY** (REQUIRED): Public key associated with the request.


### Example cURL Request

```sh
curl --location --request GET 'http://localhost:7000/token' \
--header 'x-pub-key: your-public-key' \
```


## Response

The response will be a JSON object containing the following property:

- `token`: The generated Podcast Performance Admin Token.

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

## Implementation Details

The `/token` endpoint performs the following tasks:

1. **Secret Key Verification**: Ensures the `PERFORMANCE_SECRET_KEY` environment variable is configured in your `.env` file.
2. **Payload Construction**: Constructs the payload for the token with a unique identifier and expiration time.
3. **Public Key Validation** (optional): If a public key is provided, it adds an additional property to the payload and ensures the expiration time is not overridden.
4. **Token Generation**: Signs the payload with the secret key to generate the token.
5. **Token Saving**: Saves the generated token in the database.
6. **Response**: Returns the generated token in a JSON format.

By following this guide, you should be able to successfully generate a Podcast Performance Admin Token using the `/token` endpoint.