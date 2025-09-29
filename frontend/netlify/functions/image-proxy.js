const axios = require('axios');

exports.handler = async (event, context) => {
  const { path } = event;

  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    // Extract image path from function path
    const imagePath = path.replace('/.netlify/functions/image-proxy', '');
    const imageUrl = `http://207.180.241.64:8080${imagePath}`;

    // Fetch image from backend
    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'arraybuffer',
    });

    // Determine content type based on file extension
    let contentType = 'image/jpeg';
    if (imagePath.includes('.png')) contentType = 'image/png';
    if (imagePath.includes('.gif')) contentType = 'image/gif';
    if (imagePath.includes('.webp')) contentType = 'image/webp';

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
      body: Buffer.from(response.data).toString('base64'),
      isBase64Encoded: true,
    };

  } catch (error) {
    console.error('Image proxy error:', error.message);

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Image not found',
      }),
    };
  }
};