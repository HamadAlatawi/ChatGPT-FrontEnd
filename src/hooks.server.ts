import type { Handle } from '@sveltejs/kit';

//IMPORTANT!!!!
//This is only a preview for CORS configuration.
//PLEASE change the access control once you setup your domain :)!

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    // Apply CORS header for API routes
    if (event.url.pathname.startsWith('/api')) {
        // **Preflight** Conditions for CORS
        //The browser usually does a preflight check before sending the actual request using OPTIONS to check for CORS
        if(event.request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*',
                }
            });
        }

    }

    const response = await resolve(event);
    if (event.url.pathname.startsWith('/api')) {
        response.headers.append('Access-Control-Allow-Origin', `*`);
        response.headers.append('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        response.headers.append('Access-Control-Allow-Headers', '*');
    }
    return response;
};
