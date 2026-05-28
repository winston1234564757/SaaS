const cyrillicMap: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g',
  'д': 'd', 'е': 'e', 'є': 'ye', 'ж': 'zh', 'з': 'z',
  'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k',
  'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
  'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f',
  'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
  'ь': '', 'ю': 'yu', 'я': 'ya',
};

export function transliterate(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((char) => cyrillicMap[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

export function generateSlug(fullName: string): string {
  return transliterate(fullName);
}
