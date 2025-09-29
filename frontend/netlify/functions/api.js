const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
      },
      body: ''
    };
  }

  const path = event.path.replace('/.netlify/functions/api', '');
  const url = `http://207.180.241.64:5000/api${path}`;

  const options = {
    method: event.httpMethod,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (event.headers.authorization) {
    options.headers['Authorization'] = event.headers.authorization;
  }

  if (event.body) {
    let bodyToSend = event.body;

    // Check if body looks like base64 (starts with typical base64 chars for multipart boundary)
    if (event.isBase64Encoded || (typeof event.body === 'string' && event.body.startsWith('LS0tLS0t'))) {
      try {
        const decodedBody = Buffer.from(event.body, 'base64').toString('utf-8');

        // Check if it's multipart form data
        if (decodedBody.includes('------WebKitFormBoundary') || decodedBody.includes('Content-Disposition: form-data')) {
          // Try to extract JSON from multipart
          const lines = decodedBody.split('\n');
          let jsonData = {};
          let currentField = '';
          let inField = false;

          for (let line of lines) {
            if (line.includes('Content-Disposition: form-data; name="')) {
              currentField = line.match(/name="([^"]+)"/)[1];
              inField = true;
            } else if (line.startsWith('------WebKitFormBoundary') && inField) {
              inField = false;
              currentField = '';
            } else if (inField && line.trim() && !line.includes('Content-')) {
              jsonData[currentField] = line.trim();
            }
          }

          // If we extracted data, use it as JSON
          if (Object.keys(jsonData).length > 0) {
            bodyToSend = JSON.stringify(jsonData);
          } else {
            return {
              statusCode: 400,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ error: 'Could not parse form data' })
            };
          }
        } else {
          bodyToSend = decodedBody;
        }
      } catch (e) {
        // If decoding fails, pass through as is
        bodyToSend = event.body;
      }
    }

    options.body = bodyToSend;
  }

  try {
    const response = await fetch(url, options);
    const data = await response.text();

    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: data
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};