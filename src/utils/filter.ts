/**
 * Qolda.kz platform anti-spam text and link filter.
 * Checks for known spam keywords, gambling/betting terms, bad words (profanity),
 * repeated letters/patterns, and suspicious links.
 */

export function spamFilter(text: string): { isSpam: boolean; reason?: string } {
  if (!text) return { isSpam: false };

  const textLower = text.toLowerCase();

  // 1. Profanity / Балағат сөздер
  const badWords = [
    'қотақ', 'қота', 'сигіс', 'сигу', 'сигейін', 'емшек', 'блә', 'бля', 'сука', 'хуй', 
    'пидор', 'гандон', 'еба', 'еб', 'нах', 'нахуй', 'нахер', 'блядь', 'блять', 
    'далба', 'далбаёб', 'долбо', 'долбоеб', 'шешең', 'шешенің', 'пизд', 'пизда', 'хули',
    'отырыс', 'ам', 'құтақ', 'көтен', 'сігу', 'сігейін', 'щеше'
  ];

  for (const word of badWords) {
    if (textLower.includes(word)) {
      return {
        isSpam: true,
        reason: 'Мәтінде әдепсіз немесе балағат сөздер анықталды. Поштаны және платформаны таза ұстайық!'
      };
    }
  }

  // 2. Suspicious spam/advertising words (Күмәнді сөздер)
  const spamWords = [
    'казино', 'casino', 'ставка', 'беттинг', 'betting', 'вулкан', 'vulkan', 
    'ақша тап', 'заработай быстро', 'инвестиция', 'invest', 'жұмыс ұсынамын', 
    'оңай ақша', 'тез ақша', 'легкие деньги', 'быстрые деньги', 'жарнама', 'реклама', 
    '1xbet', 'olimpbet', 'pin-up', 'азартные', 'құмар ойын', 'бабло', 'крипта',
    'crypto', 'заработок', 'работа на дому'
  ];

  for (const word of spamWords) {
    if (textLower.includes(word)) {
      return {
        isSpam: true,
        reason: `Құрамында күмәнді немесе жарнамалық/спам сөз бар: "${word}"`
      };
    }
  }

  // 3. Repeating letters (e.g., "аааааа", "сссссс")
  const repeatingCharPattern = /(.)\1{5,}/g;
  if (repeatingCharPattern.test(textLower)) {
    return {
      isSpam: true,
      reason: 'Мәтінде тым көп қайталанатын әріптер анықталды (мысалы, "аааааа"). Мәтінді дұрыс толтырыңыз.'
    };
  }

  // 4. Repeated word sequences (e.g., repeating a word 3+ times back to back)
  const words = textLower.split(/\s+/).filter(w => w.length > 2);
  if (words.length >= 3) {
    for (let i = 0; i < words.length - 2; i++) {
      if (words[i] === words[i+1] && words[i] === words[i+2]) {
        return {
          isSpam: true,
          reason: 'Мәтінде бірдей сөздердің тым көп рет қайталануы анықталды. Жазбаңызды мағыналы етіп жазыңыз.'
        };
      }
    }

    // Low uniqueness ratio checking for longer texts
    if (words.length >= 8) {
      const uniqueWords = new Set(words);
      const ratio = uniqueWords.size / words.length;
      if (ratio < 0.35) {
        return {
          isSpam: true,
          reason: 'Мәтінде мағынасыз түрде кейбір сөздер көп қайталанған. Нақтырақ мәлімет жазыңыз.'
        };
      }
    }
  }

  // 5. Links validation (көп сілтемелерді реттеу)
  const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|net|org|ru|xyz|info|biz|co|cc|top|click)\b)/gi;
  const links = text.match(urlPattern);
  if (links && links.length > 1) {
    return {
      isSpam: true,
      reason: 'Мәтінде тым көп сілтемелер анықталды (максимум 1 сілтеме рұқсат етілген).'
    };
  }

  if (links && links.length === 1) {
    const singleLink = links[0].toLowerCase();
    const badDomains = ['casin', 'vulkan', '1xb', 'xbet', 'bett', 'slot', 'win', 'olimp', 'pinup'];
    for (const b of badDomains) {
      if (singleLink.includes(b)) {
        return {
          isSpam: true,
          reason: 'Қауіпсіздік ережелеріне байланысты күмәнді жарнамалық немесе құмар ойын сілтемесін енгізуге болмайды!'
        };
      }
    }
  }

  return { isSpam: false };
}

// Keep validateAntiSpam pointing to spamFilter for full drop-in compatibility
export function validateAntiSpam(text: string): { isSpam: boolean; reason?: string } {
  return spamFilter(text);
}
