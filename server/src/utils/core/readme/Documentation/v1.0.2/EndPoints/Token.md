# Using the `/token` Endpoint

The `/token` endpoint in the Podcast Performance Server is used to generate tokens that are crucial for various functionalities within the Podcast Performance system. This document provides an overview of the endpoint and links to more detailed guides for specific use cases.

## Endpoint Overview

- **URL**: `/token`
- **Method**: GET
- **Headers**: 
  - `public_key` (required for admin token)
- **Query Parameters**: 
  - `expiresIn` (optional for non-admin token)
- **Response**: JSON object containing the generated token

## Prerequisites

1. Ensure the `PERFORMANCE_SECRET_KEY` environment variable is set on your server in the `.env` file.

## Request

### Headers

- **public_key**: The public key associated with the request. Required for admin token generation and optional for non-admin token generation.

### Query Parameters

- **expiresIn**: The expiration time for the token. Optional for non-admin token generation. If not provided, the default value from the `.env` environment variable `EXPIRES_IN` will be used.

### Example cURL Request

#### Admin Token

```sh
curl --location --request GET 'http://localhost:7000/token' \
--header 'public_key: your-public-key' \
```

#### Non-Admin Token

```sh
curl --location --request GET 'http://localhost:7000/token' \
--data-urlencode 'expiresIn=2h'
```

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

## Related Documentation

For more detailed information on generating specific types of tokens, refer to the following documents:

- [Admin Token Documentation](/documentation/v1.0.2/authorization/admintoken)
- [Non-Admin Token Documentation](/documentation/v1.0.2/authorization/non-admintoken)

By following this guide, you should be able to successfully generate both admin and non-admin tokens using the `/token` endpoint.