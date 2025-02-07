import { NextResponse } from 'next/server';
import { createOrUpdateUser } from '../../../lib/db';

export async function POST(request) {
  try {
    const userData = await request.json();
    const user = await createOrUpdateUser(userData);
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in user API:', error);
    return NextResponse.json(
      { error: 'Failed to create/update user' },
      { status: 500 }
    );
  }
} 