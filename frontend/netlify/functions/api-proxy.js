exports.handler = async (event, context) => {
  const { httpMethod, path, body, queryStringParameters, headers } = event;

  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    // Dynamic import of fetch
    const fetch = (await import('node-fetch')).default;

    // Use the correct backend port (5000)
    const API_BASE_URL = 'http://207.180.241.64:5000/api';

    // Extract the API path from the Netlify function path
    const apiPath = path.replace('/.netlify/functions/api-proxy', '').replace('/.netlify/functions/api', '');
    const url = `${API_BASE_URL}${apiPath}`;

    // Prepare query string
    const queryString = queryStringParameters
      ? '?' + new URLSearchParams(queryStringParameters).toString()
      : '';

    // Prepare headers for backend request
    const backendHeaders = {};

    // Forward important headers
    if (headers.authorization) {
      backendHeaders['Authorization'] = headers.authorization;
    }

    // Set appropriate content-type
    if (headers['content-type']) {
      backendHeaders['Content-Type'] = headers['content-type'];
    } else if (body) {
      backendHeaders['Content-Type'] = 'application/json';
    }

    // Make request to backend
    const fetchOptions = {
      method: httpMethod,
      headers: backendHeaders,
    };

    // Add body for POST/PUT requests
    if (body && (httpMethod === 'POST' || httpMethod === 'PUT')) {
      fetchOptions.body = body;
    }

    const response = await fetch(url + queryString, fetchOptions);
    const responseData = await response.text();

    // Try to parse as JSON
    let responseBody;
    try {
      responseBody = JSON.parse(responseData);
    } catch (e) {
      responseBody = responseData;
    }

    return {
      statusCode: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
      body: typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody),
    };

  } catch (error) {
    console.error('Proxy error:', error);

    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        message: error.message || 'Server error',
      }),
    };
  }
};