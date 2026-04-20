import { ParsedRow } from '@/types';
import { CATEGORY_KEYWORD_MAP } from '@/constants/categories';

function suggestCategoryName(desc: string): string | null {
  const lower = desc.toLowerCase();
  for (const [keyword, catName] of Object.entries(CATEGORY_KEYWORD_MAP)) {
    if (lower.includes(keyword)) return catName;
  }
  return null;
}

let _categoryNameToId: Record<string, string> = {};

export function setCategoryMap(map: Record<string, string>) {
  _categoryNameToId = map;
}

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/,/g, '')) || 0;
}

function parseDate(raw: string): Date | null {
  const cleaned = raw.trim();
  const formats = [
    /^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/,
    /^(\d{2})[\/\-](\d{2})[\/\-](\d{2})$/,
    /^(\d{2})\s+(\w{3})\s+(\d{4})$/i,
  ];

  const [f1, f2] = formats;
  let m = cleaned.match(f1);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);
  m = cleaned.match(f2);
  if (m) {
    const year = parseInt(m[3], 10) < 100 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10);
    return new Date(`${year}-${m[2]}-${m[1]}`);
  }
  return null;
}

function detectDebitCredit(line: string): 'income' | 'expense' | null {
  const lower = line.toLowerCase();
  if (/\b(cr|credit|deposit|credited)\b/.test(lower)) return 'income';
  if (/\b(dr|debit|withdrawal|debited|paid)\b/.test(lower)) return 'expense';
  return null;
}

function parseTabular(text: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  const amountPattern = /([\d,]+\.\d{2})/g;
  const datePattern = /\b(\d{2}[\/\-]\d{2}[\/\-]\d{2,4})\b/;

  const lines = text.split('\n').filter((l) => l.trim().length > 10);

  for (const line of lines) {
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;

    const amounts = [...line.matchAll(amountPattern)].map((m) => parseAmount(m[1]));
    if (amounts.length === 0) continue;

    const date = parseDate(dateMatch[1]);
    const type = detectDebitCredit(line) ?? (amounts.length >= 2 ? 'expense' : 'expense');

    const descStart = dateMatch.index! + dateMatch[0].length;
    const desc = line
      .substring(descStart)
      .replace(amountPattern, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 60);

    const amount = amounts[amounts.length > 1 ? amounts.length - 2 : 0];
    if (amount <= 0) continue;

    const catName = suggestCategoryName(desc);
    rows.push({
      date,
      description: desc || 'Transaction',
      amount,
      suggestedType: type,
      suggestedCategoryId: catName ? (_categoryNameToId[catName] ?? null) : null,
      raw: line.trim(),
    });
  }
  return rows;
}

export function parseBankStatement(text: string): ParsedRow[] {
  const rows = parseTabular(text);
  const seen = new Set<string>();
  return rows.filter((r) => {
    const key = `${r.date?.toISOString()}_${r.amount}_${r.description}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
