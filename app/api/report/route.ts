import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reporterId, reportedId, reason, details, screenshotData } = body;

    if (!reporterId || !reportedId || !reason || !screenshotData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_SOCKET_URL}/api/report`;

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reporterId, reportedId, reason, details, screenshotData }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return NextResponse.json(
        { error: `Backend Error: ${errorText}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Report successfully submitted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/report:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export function OPTIONS() {
  return new Response(null, {
    headers: {
      Allow: 'POST, OPTIONS',
    },
  });
}
