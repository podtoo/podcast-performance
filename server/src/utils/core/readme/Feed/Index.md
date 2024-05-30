# Get Token

To fetch token you will need to send a GET request to `/token`.

You can also send optional data like `/token?expiresIn=1` the 1 represents how many hours you want this token to be valid for.

If a token tries to send data after this time it will not be accepted by the server.

# Integrate into your feed

Depending on how you have generated your RSS feed, it may be a little different, as PodToo uses NodeJS the code below suits our need however you should be able to adapt it.

# Sample Code

<div>
  <button onclick="showCode('nodejs')">NodeJS</button>
  <button onclick="showCode('php')">PHP</button>
</div>

<div id="nodejs" class="code-sample" style="display: none;">
<ol>
<li>Add to .env the following
<div class="codeCSS">
  <pre><code class="language-javascript">
  // In Your .env file add PERFORMANCE_SECRET_KEY=(same value as your podcast-performance server)
  </code></pre>
</div>
</li>

<li> Add the following to your feed RSS generator
<div class="codeCSS">
<pre><code class="language-javascript">
    const axios = require('axios');
    const jwt = require('jsonwebtoken');

    // HTTPS recommended but http is ok you can remove port if you use a NGINX proxy.
    const tokenResponse = await axios.get('http://SERVER DOMAIN OR IP ADDRESS:7000/token');

    const tokenResponse = await axios.get('http://SERVER DOMAIN OR IP ADDRESS:7000/token'); // Update the URL as necessary
      const token = tokenResponse.data.token;

      // Verify the token
      const secretKey = process.env.PERFORMANCE_SECRET_KEY;
      if (!secretKey) {
        return res.status(500).json({ error: 'Secret key not configured. Please add PERFORMANCE_SECRET_KEY to your .env' });
      }

      let decodedToken;
      try {
        decodedToken = jwt.verify(token, secretKey);
        console.log('Decoded Token:', decodedToken); // For debugging purposes
      } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Extract s and d from the decoded token
      const { s, d, exp } = decodedToken;

    // Add this to your FEED Code
    `<podcast:performance url="https://SERVER DOMAIN OR IP ADDRESS/episodeperformance/${s}" tokenExpires="${exp}" duration="${d}"></podcast:performance>`;
      
  </code></pre></div>
  </li>
  <li>And you're done</li>
</div>

<div id="php" class="code-sample" style="display: none;">
<ol>
<li>Add to .env the following
<div class="codeCSS">
  <pre><code class="language-php">
  // In Your .env file add PERFORMANCE_SECRET_KEY=(same value as your podcast-performance server)
  </code></pre>
  </div>
</li>
<li> Add the following to your feed RSS generator
<div class="codeCSS">
<pre><code class="language-php">
    &lt;?php
require 'vendor/autoload.php';
use Firebase\JWT\JWT;
use GuzzleHttp\Client;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$secretKey = getenv('PERFORMANCE_SECRET_KEY');
if (!$secretKey) {
    http_response_code(500);
    echo json_encode(['error' => 'Secret key not configured. Please add PERFORMANCE_SECRET_KEY to your .env']);
    exit;
}

$client = new Client();

try {
    // HTTPS recommended but http is ok you can remove port if you use a NGINX proxy.
    $response = $client->request('GET', 'http://SERVER_DOMAIN_OR_IP_ADDRESS:7000/token');
    $responseBody = $response->getBody()->getContents();
    $tokenData = json_decode($responseBody, true);
    $token = $tokenData['token'];
} catch (Exception $e) {
    echo 'Error fetching token: ',  $e->getMessage(), "\n";
    exit;
}

try {
    $decodedToken = JWT::decode($token, $secretKey, ['HS256']);
    $decodedArray = (array) $decodedToken;
    error_log('Decoded Token: ' . print_r($decodedArray, true)); // For debugging purposes
} catch (Exception $e) {
    error_log('Error verifying token: ' . $e->getMessage());
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token']);
    exit;
}

$s = $decodedArray['s'];
$d = $decodedArray['d'];
$exp = $decodedArray['exp'];

// Add this to your FEED Code
$performanceTag = "<podcast:performance url=\"https://SERVER_DOMAIN_OR_IP_ADDRESS/episodeperformance/{$s}\" tokenExpires=\"{$exp}\" duration=\"{$d}\"></podcast:performance>";

// Assuming you have a way to insert this into your feed
// echo or save $performanceTag to your RSS feed generator
echo $performanceTag;
?>
  </code></pre>
  </div>
  </li>
  <li>And you're done</li>
</div>

 
<script>
  function showCode(language) {
    document.querySelectorAll('.code-sample').forEach(div => {
      div.style.display = 'none';
    });
    document.getElementById(language).style.display = 'block';
  }

  // Show NodeJS code by default
  document.addEventListener('DOMContentLoaded', function() {
    showCode('nodejs');
  });
</script>
