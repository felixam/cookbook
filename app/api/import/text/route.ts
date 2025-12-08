import { NextResponse } from 'next/server';
import { extractRecipeFromText } from '@/lib/replicate/client';
import { requireAuth } from '@/lib/auth/session';

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { text, strict } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text ist erforderlich' },
        { status: 400 }
      );
    }

    // Extract recipe using AI
    const recipe = await extractRecipeFromText(text, strict === true);

    return NextResponse.json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    console.error('Text import error:', error);

    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';

    if (message.includes('No JSON') || message.includes('Missing')) {
      return NextResponse.json(
        {
          error: 'Konnte kein Rezept im Text erkennen. Bitte überprüfe die Eingabe.',
          code: 'EXTRACTION_FAILED',
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        error: 'Fehler beim Importieren des Rezepts',
        code: 'SERVICE_ERROR',
      },
      { status: 500 }
    );
  }
}
