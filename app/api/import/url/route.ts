import { NextResponse } from 'next/server';
import { extractRecipeFromText } from '@/lib/replicate/client';
import { fetchRecipeContent } from '@/lib/utils/url-fetch';
import { requireAuth } from '@/lib/auth/session';

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { url, strict } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL ist erforderlich' },
        { status: 400 }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json(
        { error: 'Ungültige URL' },
        { status: 400 }
      );
    }

    // Fetch page content
    const content = await fetchRecipeContent(parsedUrl.toString());

    if (content.length < 100) {
      return NextResponse.json(
        {
          error: 'Konnte keine Rezeptinhalte auf der Seite finden',
          code: 'NO_CONTENT',
        },
        { status: 422 }
      );
    }

    // Extract recipe using AI
    const recipe = await extractRecipeFromText(content, strict === true);

    // Add source URL to the recipe
    recipe.sourceUrl = parsedUrl.toString();

    return NextResponse.json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    console.error('URL import error:', error);

    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';

    if (message.includes('Fehler beim Laden')) {
      return NextResponse.json(
        {
          error: 'Konnte die Webseite nicht laden. Bitte überprüfe die URL.',
          code: 'FETCH_FAILED',
        },
        { status: 422 }
      );
    }

    if (message.includes('No JSON') || message.includes('Missing')) {
      return NextResponse.json(
        {
          error: 'Konnte kein Rezept auf der Seite finden. Bitte versuche es mit einer anderen URL.',
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
