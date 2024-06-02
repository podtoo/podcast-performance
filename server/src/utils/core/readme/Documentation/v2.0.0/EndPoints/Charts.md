# Using the `/charts` Endpoint

The `/charts` endpoint is a POST endpoint in our Podcast Performance Server designed to return episode performance data based on a provided GUID and a valid Podcast Performance Admin Token. This document provides a step-by-step guide on how to use this endpoint.

## Endpoint Overview

- **URL**: `/charts`
- **Method**: POST
- **Headers**: 
  - `Authorization: Bearer <Podcast Performance Admin Token>`
- **Request Body**: JSON object containing `guid` and optionally `publickey` properties
- **Response**: JSON object containing episode performance data

## Prerequisites

1. **Obtain Admin Token**: You need to get an admin token from the `/token` endpoint first.
2. Ensure you have a valid Podcast Performance Admin Token.
3. Ensure the `PERFORMANCE_SECRET_KEY` & `PERFORMANCE_PUBLIC_KEY` environment variable is set on your server.

## Request

### Headers

- **Authorization**: Include the Podcast Performance Admin Token in the Authorization header using the Bearer schema.

### Body

The request body must be a JSON object with the following properties:

- `guid`: The unique identifier for the episode.


#### Example

```json
{
  "guid": "your-episode-guid",
}
```

### Example cURL Request

```sh
curl --location --request POST 'http://localhost:7000/charts' \
--header 'Authorization: Bearer your-podcast-performance-admin-token' \
--header 'Content-Type: application/json' \
--data-raw '{
    "guid": "your-episode-guid"
}'
```

### Sample cURL Request

```sh
curl --location --request POST 'http://localhost:7000/charts' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzIjoibHd1czh6NnAtZDYyNjBhN2RkYmIwODZlNCIsImQiOiIxIiwiYSI6dHJ1ZSwiaWF0IjoxNzE3MTY1OTE0LCJleHAiOjE3MTcxNjk1MTR9.eUTxAjLJ8NcP_I-mNgVAlUyQSJpSIuuQBNz6wDiYcXM' \
--header 'Content-Type: application/json' \
--data-raw '{
    "guid": "your-episode-guid"
}'
```

## Response

The response will be a JSON object containing the following properties:

- `guid`: The GUID of the episode.
- `duration`: The total duration of the episode in seconds.
- `data`: An array of objects, each containing `time` and `percentage` properties representing the performance data.

### Example Response

```json
{
  "guid": "your-episode-guid",
  "duration": 3600,
  "data": [
    { "time": 0, "percentage": 100 },
    { "time": 10, "percentage": 95 },
    // more data points...
  ]
}
```

## Error Handling

The endpoint may return various HTTP status codes to indicate errors:

- `401 Unauthorized`: Invalid or missing Podcast Performance Admin Token.
- `400 Bad Request`: Invalid request body.
- `404 Not Found`: Episode not found or no data found for the episode.
- `500 Internal Server Error`: Server encountered an unexpected condition.

### Example Error Response

```json
{
  "error": "Unauthorized"
}
```

## Implementation Details

The `/charts` endpoint is implemented using the `getChartDataRouter`, which handles the following tasks:

1. **Podcast Performance Admin Token Verification**: Validates the Podcast Performance Admin Token provided in the Authorization header.
2. **Request Validation**: Ensures the request body contains a valid GUID.
3. **Database Queries**: 
   - Fetches token data from the database to verify its validity.
   - Retrieves episode duration and performance data.
4. **Data Processing**:
   - Calculates the percentage of occurrences for each time point in the episode based on the performance data.
5. **Response**: Returns the processed data in a structured JSON format.


By following this guide, you should be able to successfully interact with the `/charts` endpoint to retrieve episode performance data.