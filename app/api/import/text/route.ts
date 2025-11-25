import { NextResponse } from 'next/server';
import { extractRecipeFromText } from '@/lib/replicate/client';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text ist erforderlich' },
        { status: 400 }
      );
    }

    if (text.trim().length < 50) {
      return NextResponse.json(
        { error: 'Text ist zu kurz. Bitte gib mehr Rezeptdetails ein.' },
        { status: 400 }
      );
    }

    // Extract recipe using AI
    const recipe = await extractRecipeFromText(text);

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
