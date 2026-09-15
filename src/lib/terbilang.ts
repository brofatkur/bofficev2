/**
 * Konversi angka rupiah ke teks terbilang Bahasa Indonesia
 * Contoh: 1500000 -> "Satu Juta Lima Ratus Ribu Rupiah"
 */
export function terbilang(n: number): string {
  if (isNaN(n)) return '';
  n = Math.floor(Math.abs(n));
  if (n === 0) return 'Nol Rupiah';

  const satuan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  function toWords(num: number): string {
    if (num < 12) {
      return satuan[num];
    } else if (num < 20) {
      return toWords(num - 10) + ' Belas';
    } else if (num < 100) {
      return toWords(Math.floor(num / 10)) + ' Puluh ' + toWords(num % 10);
    } else if (num < 200) {
      return 'Seratus ' + toWords(num - 100);
    } else if (num < 1000) {
      return toWords(Math.floor(num / 100)) + ' Ratus ' + toWords(num % 100);
    } else if (num < 2000) {
      return 'Seribu ' + toWords(num - 1000);
    } else if (num < 1000000) {
      return toWords(Math.floor(num / 1000)) + ' Ribu ' + toWords(num % 1000);
    } else if (num < 1000000000) {
      return toWords(Math.floor(num / 1000000)) + ' Juta ' + toWords(num % 1000000);
    } else if (num < 1000000000000) {
      return toWords(Math.floor(num / 1000000000)) + ' Miliar ' + toWords(num % 1000000000);
    } else {
      return toWords(Math.floor(num / 1000000000000)) + ' Triliun ' + toWords(num % 1000000000000);
    }
  }

  const result = toWords(n).replace(/\s+/g, ' ').trim();
  return result + ' Rupiah';
}
