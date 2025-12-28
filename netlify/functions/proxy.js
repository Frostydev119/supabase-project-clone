exports.handler = async function(event, context) {
  // Handle OPTIONS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: '',
    };
  }

  // Extract the path from the event
  // For /.netlify/functions/proxy/projects, we want /projects
  let path = event.path.replace('/.netlify/functions/proxy', '') || '/projects';
  
  // Build the full Supabase API URL (v1 API)
  const supabaseUrl = `https://api.supabase.com/v1${path}`;
  
  console.log('Proxying request:', {
    method: event.httpMethod,
    originalPath: event.path,
    extractedPath: path,
    supabaseUrl: supabaseUrl,
    hasAuth: !!(event.headers.authorization || event.headers.Authorization)
  });
  
  try {
    // Use native fetch (available in Node 18+ which Netlify uses)
    const response = await fetch(supabaseUrl, {
      method: event.httpMethod,
      headers: {
        'Authorization': event.headers.authorization || event.headers.Authorization || '',
        'Content-Type': 'application/json',
      },
      body: event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD' ? event.body : undefined,
    });
    
    const data = await response.text();
    
    console.log('Response from Supabase:', {
      status: response.status,
      ok: response.ok,
      dataLength: data.length
    });
    
    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json',
      },
      body: data,
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Proxy error: ' + error.message,
        details: error.stack,
        url: supabaseUrl
      }),
    };
  }
}
