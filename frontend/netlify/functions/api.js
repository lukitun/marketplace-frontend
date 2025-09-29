exports.handler = async (event, context) => {
  const { httpMethod, path, body, queryStringParameters, headers, isBase64Encoded } = event;

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
    // Use the correct backend port (5000)
    const API_BASE_URL = 'http://207.180.241.64:5000/api';

    // Extract the API path from the Netlify function path
    const apiPath = path.replace('/.netlify/functions/api', '');
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

    // Handle content-type
    const contentType = headers['content-type'] || headers['Content-Type'];

    console.log('=== NETLIFY FUNCTION DEBUG ===');
    console.log('Method:', httpMethod);
    console.log('Path:', apiPath);
    console.log('Content-Type:', contentType);
    console.log('isBase64Encoded:', isBase64Encoded);
    console.log('Body type:', typeof body);
    console.log('Body length:', body ? body.length : 0);
    console.log('Body preview:', body ? body.substring(0, 100) : 'null');

    // Make request to backend
    const fetchOptions = {
      method: httpMethod,
      headers: {
        'Content-Type': 'application/json',
        ...backendHeaders
      },
    };

    // Handle body for POST/PUT requests
    if (body && (httpMethod === 'POST' || httpMethod === 'PUT')) {
      let requestBody = body;

      // If the body is base64 encoded, decode it first
      if (isBase64Encoded) {
        console.log('Decoding base64 body...');
        try {
          const decodedBuffer = Buffer.from(body, 'base64');
          requestBody = decodedBuffer.toString('utf8');
          console.log('Decoded body:', requestBody.substring(0, 200));
        } catch (decodeError) {
          console.error('Failed to decode base64:', decodeError);
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              success: false,
              message: 'Failed to decode request body',
            }),
          };
        }
      }

      // For multipart form data, we need to parse it and convert to JSON
      if (contentType && contentType.includes('multipart/form-data')) {
        console.log('Processing multipart form data...');

        // For now, return an error since we don't support file uploads
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            success: false,
            message: 'File uploads are not supported. Please create posts without images.',
          }),
        };
      } else {
        // Handle as JSON
        try {
          // Try to parse as JSON to validate
          const parsedData = JSON.parse(requestBody);
          fetchOptions.body = JSON.stringify(parsedData);
          console.log('Sending JSON to backend:', fetchOptions.body);
        } catch (jsonError) {
          console.error('Invalid JSON in request body:', jsonError);
          console.log('Raw body that failed parsing:', requestBody);
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              success: false,
              message: 'Invalid JSON in request body',
            }),
          };
        }
      }
    }

    console.log('Making request to:', url + queryString);

    // Dynamic import of fetch
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url + queryString, fetchOptions);
    const responseData = await response.text();

    console.log('Backend response status:', response.status);
    console.log('Backend response:', responseData.substring(0, 200));

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
    console.error('=== NETLIFY FUNCTION ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        message: error.message || 'Server error',
        debug: {
          type: typeof body,
          isBase64: isBase64Encoded,
          contentType: headers['content-type']
        }
      }),
    };
  }
};