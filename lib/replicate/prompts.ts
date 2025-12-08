export const RECIPE_EXTRACTION_PROMPT = (strict: boolean) => `Du bist ein Experte für das Extrahieren von Rezeptinformationen. Analysiere den gegebenen Inhalt und extrahiere das Rezept als JSON-Objekt.

Gib NUR gültiges JSON zurück, ohne zusätzlichen Text. Das JSON muss folgendes Format haben:

{
  "title": "Name des Rezepts",
  "servings": 4,
  "ingredients": [
    {"name": "Zutatname", "amount": 200, "unit": "g"},
    {"name": "Salz", "amount": null, "unit": "nach Geschmack"}
  ],
  "instructions": "# Vorbereitung\\n1. Zwiebeln würfeln und anbraten\\n2. Knoblauch hinzufügen\\n\\n# Zubereitung\\n1. Mit Brühe ablöschen\\n2. 20 Minuten köcheln lassen"
}

Regeln:
- Extrahiere genaue Mengen wenn möglich
- Verwende metrische Einheiten (g, ml, EL, TL, Stück)
- Für "nach Geschmack" oder unbestimmte Mengen: amount = null
- Halte Zutatennamen einfach und klar
- Gib die Anleitung als Markdown formatierten Text zurück. Verwende nummerierte Listen für die Schritte. Falls wirklich sinnvoll, verwende Überschriften (#) zur Strukturierung. Aber standardmäßig nur eine nummerierte Liste.
${strict ? '- Behalte Formulierungen für Titel, Zutaten und Anweisungen aus dem Ursprungsrezept bei und formuliere nicht um' : ''}
- Antworte NUR mit gültigem JSON`;

export const IMAGE_RECIPE_PROMPT = (strict: boolean) => `${RECIPE_EXTRACTION_PROMPT(strict)}

Analysiere das Bild und extrahiere alle Rezeptinformationen die du erkennen kannst.`;

export const URL_RECIPE_PROMPT = (strict: boolean) => `${RECIPE_EXTRACTION_PROMPT(strict)}

Hier ist der Inhalt der Webseite:`;
