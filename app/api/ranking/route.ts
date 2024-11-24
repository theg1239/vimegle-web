import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_SOCKET_URL}/api/ranking?userId=${encodeURIComponent(userId)}`;

    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (backendResponse.ok) {
      const data = await backendResponse.json();
      return NextResponse.json(data, { status: 200 });
    } else {
      const errorData = await backendResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch user ranking' },
        { status: backendResponse.status }
      );
    }
  } catch (error) {
    console.error('Error in /api/getUserRanking:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
