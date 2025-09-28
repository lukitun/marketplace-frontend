const axios = require('axios');

const API_BASE_URL = 'http://207.180.241.64:8080/api';

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
    // Extract the API path from the Netlify function path
    const apiPath = path.replace('/.netlify/functions/api', '');
    const url = `${API_BASE_URL}${apiPath}`;

    // Prepare query string
    const queryString = queryStringParameters
      ? '?' + new URLSearchParams(queryStringParameters).toString()
      : '';

    // Prepare headers for backend request
    const backendHeaders = {
      'Content-Type': 'application/json',
    };

    // Forward Authorization header if present
    if (headers.authorization) {
      backendHeaders.Authorization = headers.authorization;
    }

    // Make request to backend
    const config = {
      method: httpMethod.toLowerCase(),
      url: url + queryString,
      headers: backendHeaders,
    };

    if (body && (httpMethod === 'POST' || httpMethod === 'PUT')) {
      config.data = body;
    }

    const response = await axios(config);

    return {
      statusCode: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response.data),
    };

  } catch (error) {
    console.error('Proxy error:', error.message);

    return {
      statusCode: error.response?.status || 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: error.response?.data?.message || 'Server error',
      }),
    };
  }
};