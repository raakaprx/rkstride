/**
 * RKStride - Pure Markdown-Lite Message Tokenizer for rkbot
 * Separates message parsing from React JSX rendering.
 */

export type FormattedSegment =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string };

export type FormattedLine =
  | { type: 'spacer' }
  | { type: 'heading'; text: string }
  | { type: 'bullet'; segments: FormattedSegment[] }
  | { type: 'paragraph'; segments: FormattedSegment[] };

function parseBoldSegments(input: string): FormattedSegment[] {
  return input.split(/(\*\*[^*]+\*\*)/g).map((part) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return { type: 'bold', value: part.slice(2, -2) };
    }
    return { type: 'text', value: part };
  });
}

export function tokenizeCoachMessage(text: string): FormattedLine[] {
  return text.split('\n').map((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return { type: 'spacer' };
    }
    if (trimmed.startsWith('#')) {
      return { type: 'heading', text: trimmed.replace(/^#+\s*/, '') };
    }
    if (/^[-\*•]\s+/.test(trimmed)) {
      return {
        type: 'bullet',
        segments: parseBoldSegments(trimmed.replace(/^[-\*•]\s+/, '')),
      };
    }
    return {
      type: 'paragraph',
      segments: parseBoldSegments(trimmed),
    };
  });
}
