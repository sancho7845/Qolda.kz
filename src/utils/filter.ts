/**
 * Qolda.kz platform anti-spam text and link filter.
 * Checks for known spam keywords, gambling/betting terms, and suspicious external URLs.
 */
export function validateAntiSpam(text: string): { isSpam: boolean; reason?: string } {
  if (!text) return { isSpam: false };

  const spamWords = [
    'казино', 'casino', 'ставка', 'беттинг', 'betting', 'вулкан', 'vulkan', 
    'ақша тап', 'заработай быстро', 'инвестиция', 'invest', 'жұмыс ұсынамын', 
    'оңай ақша', 'тез ақша', 'легкие деньги', 'быстрые деньги', 'жарнама', 'реклама', 
    '1xbet', 'olimpbet', 'pin-up', 'азартные', 'құмар ойын', 'бабло', 'крипта',
    'crypto', 'заработок', 'работа на дому'
  ];

  const textLower = text.toLowerCase();

  // 1. Check for spam keywords
  for (const word of spamWords) {
    if (textLower.includes(word)) {
      return { 
        isSpam: true, 
        reason: `Құрамында күмәнді немесе жарнамалық/спам сөз бар: "${word}"` 
      };
    }
  }

  // 2. Check for suspicious links (e.g., http://, https://, www., or links with domains)
  const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|net|org|ru|xyz|info|biz|co|cc|top|click)\b)/gi;
  if (urlPattern.test(text)) {
    return { 
      isSpam: true, 
      reason: 'Қауіпсіздік ережелеріне байланысты күмәнді сілтемелер немесе сыртқы сілтемелер жазуға тыйым салынады.' 
    };
  }

  return { isSpam: false };
}
