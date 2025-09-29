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
    options.body = event.body;
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