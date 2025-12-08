import { NextResponse } from 'next/server';
import { extractRecipeFromImage } from '@/lib/replicate/client';
import { requireAuth } from '@/lib/auth/session';

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { image, strict } = await request.json();

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Bild ist erforderlich' },
        { status: 400 }
      );
    }

    const recipe = await extractRecipeFromImage(image, strict === true);

    return NextResponse.json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    console.error('Image import error:', error);

    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';

    // Check for specific error types
    if (message.includes('No JSON') || message.includes('Missing')) {
      return NextResponse.json(
        {
          error: 'Konnte kein Rezept aus dem Bild extrahieren. Bitte versuche es mit einem anderen Bild.',
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
