export const runtime = 'edge';
export const preferredRegion = 'home';
export const dynamic = 'force-dynamic';

export function GET(request: Request) {
    return new Response(`I am an Edge Function!`, {
        status: 200,
    });
}
