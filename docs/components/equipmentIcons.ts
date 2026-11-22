/**
 * Equipment icons for the 12 canonical equipment values in taxonomy/equipment.json.
 * Drawn for this project in the lucide style (24x24, 2px round strokes) so they sit
 * next to the SparkyFitness web app's lucide icons. Each value is the inner SVG markup.
 */
export const EQUIPMENT_ICONS: Record<string, string> = {
  barbell:
    '<path d="M2 12h20"/><rect x="4" y="7" width="3" height="10" rx="1"/><rect x="17" y="7" width="3" height="10" rx="1"/><path d="M7 9.5v5M17 9.5v5"/>',
  dumbbell:
    '<path d="M8 12h8"/><rect x="3" y="8" width="5" height="8" rx="1.5"/><rect x="16" y="8" width="5" height="8" rx="1.5"/>',
  kettlebells:
    '<path d="M8.5 9.5V7a3.5 3.5 0 0 1 7 0v2.5"/><path d="M6.5 13.5a5.5 5.5 0 1 1 11 0c0 3-1.5 6.5-5.5 6.5s-5.5-3.5-5.5-6.5z"/>',
  'e-z curl bar':
    '<path d="M2 12h3l2-2 2.5 4 2.5-4 2.5 4 2.5-4 2 2h3"/><path d="M4.5 8v8M19.5 8v8"/>',
  cable:
    '<path d="M4 3v18M4 4h9"/><circle cx="14" cy="5" r="2"/><path d="M16 5v9"/><path d="M13 14h6l-1 3h-4z"/><path d="M4 21h4"/>',
  machine:
    '<rect x="3" y="3" width="6" height="18" rx="1"/><path d="M5 7h2M5 10h2M5 13h2"/><path d="M9 6h8a2 2 0 0 1 2 2v2"/><path d="M14 21v-7h6"/><path d="M12 21h10"/>',
  bands:
    '<path d="M5 5c4 3 4 11 0 14"/><path d="M19 5c-4 3-4 11 0 14"/><path d="M5 5h14M5 19h14"/>',
  'medicine ball':
    '<circle cx="12" cy="12" r="9"/><path d="M3.5 9.5h17M3.5 14.5h17"/>',
  'exercise ball':
    '<circle cx="12" cy="11" r="8"/><path d="M6.5 5.5c3 2 5 7.5 5.5 13.5M17.5 5.5c-3 2-5 7.5-5.5 13.5"/><path d="M8 21h8"/>',
  'foam roll':
    '<ellipse cx="6" cy="12" rx="3" ry="6"/><path d="M6 6h12M6 18h12"/><path d="M18 6a3 6 0 0 1 0 12"/><path d="M11 6v12M15 6v12"/>',
  'body only':
    '<circle cx="12" cy="4.5" r="2"/><path d="M5 9l7-1.5L19 9"/><path d="M12 7.5v6l-3.5 7.5M12 13.5l3.5 7.5"/>',
  other:
    '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="16" cy="12" r="1" fill="currentColor"/>',
};

export function equipmentIconSvg(name: string, size = 24): string {
  const body = EQUIPMENT_ICONS[name] ?? EQUIPMENT_ICONS.other;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
