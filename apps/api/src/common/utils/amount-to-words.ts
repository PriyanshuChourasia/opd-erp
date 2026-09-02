/**
 * Convert an amount in paise (smallest currency unit) to Indian English words.
 * Uses the Indian numbering system (lakhs, crores).
 *
 * Example: 41800 paise → "Four Hundred and Eighteen"
 *          12345600 paise → "Twelve Thousand Three Hundred and Forty-Five"
 */
export function amountToWords(paise: number): string {
  if (paise === 0) return 'Zero';

  const rupees = Math.floor(Math.abs(paise) / 100);
  const negative = paise < 0 ? 'Minus ' : '';

  return negative + convertNumber(rupees) + ' Rupees Only';
}

function convertNumber(num: number): string {
  if (num === 0) return '';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertGroup(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) {
      const t = Math.floor(n / 10);
      const o = n % 10;
      return tens[t] + (o ? ' ' + ones[o] : '');
    }
    const h = Math.floor(n / 100);
    const remainder = n % 100;
    return ones[h] + ' Hundred' + (remainder ? ' and ' + convertGroup(remainder) : '');
  }

  // Indian grouping: last 3 digits, then groups of 2
  const parts: string[] = [];
  let remaining = num;

  if (remaining >= 10000000) {
    const crore = Math.floor(remaining / 10000000);
    parts.push(convertGroup(crore) + ' Crore');
    remaining %= 10000000;
  }
  if (remaining >= 100000) {
    const lakh = Math.floor(remaining / 100000);
    parts.push(convertGroup(lakh) + ' Lakh');
    remaining %= 100000;
  }
  if (remaining >= 1000) {
    const thousand = Math.floor(remaining / 1000);
    parts.push(convertGroup(thousand) + ' Thousand');
    remaining %= 1000;
  }
  if (remaining > 0) {
    parts.push(convertGroup(remaining));
  }

  return parts.join(' ');
}
