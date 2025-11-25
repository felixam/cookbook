import { getSetting, setSetting } from '@/lib/db/queries/settings';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const model = await getSetting('recipe_model');
    return NextResponse.json({ model: model || 'openai/gpt-5' });
  } catch (error) {
    console.error('Error fetching model setting:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { model } = await req.json();

    const validModels = [
      'openai/gpt-5-mini',
      'google/gemini-3-pro',
      'google/gemini-2.5-flash',
      'anthropic/claude-4.5-sonnet'
    ];

    if (!validModels.includes(model)) {
      return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
    }

    await setSetting('recipe_model', model);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting model:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
