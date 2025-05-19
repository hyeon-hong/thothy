import { NextRequest } from 'next/server';

const LANGGRAPH_BASE_URL = 'http://localhost:2024';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const apiUrl = `${LANGGRAPH_BASE_URL}/${path}${request.nextUrl.search}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        ...Object.fromEntries(request.headers),
        'host': new URL(LANGGRAPH_BASE_URL).host,
      },
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error('Error proxying GET request:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const apiUrl = `${LANGGRAPH_BASE_URL}/${path}${request.nextUrl.search}`;

  try {
    const body = await request.text();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        ...Object.fromEntries(request.headers),
        'host': new URL(LANGGRAPH_BASE_URL).host,
        'content-type': 'application/json',
      },
      body,
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error('Error proxying POST request:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Handle other HTTP methods
export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const apiUrl = `${LANGGRAPH_BASE_URL}/${path}${request.nextUrl.search}`;

  try {
    const body = await request.text();
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        ...Object.fromEntries(request.headers),
        'host': new URL(LANGGRAPH_BASE_URL).host,
        'content-type': 'application/json',
      },
      body,
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error('Error proxying PUT request:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const apiUrl = `${LANGGRAPH_BASE_URL}/${path}${request.nextUrl.search}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        ...Object.fromEntries(request.headers),
        'host': new URL(LANGGRAPH_BASE_URL).host,
      },
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error('Error proxying DELETE request:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Add CORS headers to all responses
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 