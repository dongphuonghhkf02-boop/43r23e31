/**
 * seedI18n.js — Frontend translation helper for legacy MongoDB seed data.
 *
 * Cabinet pages render data (invoices, shipment timeline events, notifications)
 * that was originally seeded UK-only. Until the backend exposes per-language
 * fields for every seed record, this helper translates known UK strings into
 * EN/RU on the fly.
 *
 * Usage:
 *   import { tSeed } from '../utils/seedI18n';
 *   <p>{tSeed(invoice.description, lang)}</p>
 *
 * If the string is unknown, returns it unchanged.
 */

// Dictionary of UK -> { en, ru } mappings for well-known seed data.
const SEED_DICT = {
  'Готово до видачі': { en: 'Ready for pickup', ru: 'Готов к выдаче' },
  '🏁 Готово до видачі': { en: '🏁 Ready for pickup', ru: '🏁 Готов к выдаче' },
  'за Audi Q7': { en: 'for Audi Q7', ru: 'за Audi Q7' },
  'за Mercedes-Benz': { en: 'for Mercedes-Benz', ru: 'за Mercedes-Benz' },
  'за BMW': { en: 'for BMW', ru: 'за BMW' },
  'за Tesla': { en: 'for Tesla', ru: 'за Tesla' },
  ' за ': { en: ' for ', ru: ' за ' },
  // Invoice description fragments
  'Вартість авто': { en: 'Vehicle cost', ru: 'Стоимость авто' },
  'Послуги': { en: 'Services', ru: 'Услуги' },
  'Депозит': { en: 'Deposit', ru: 'Депозит' },
  'Доставка': { en: 'Delivery', ru: 'Доставка' },
  'Доставка та логістика': { en: 'Delivery & logistics', ru: 'Доставка и логистика' },
  'Основна оплата': { en: 'Main payment', ru: 'Основная оплата' },
  'Передплата': { en: 'Advance payment', ru: 'Предоплата' },
  'Повна оплата': { en: 'Full payment', ru: 'Полная оплата' },
  ' від ': { en: ' from ', ru: ' от ' },
  // City names
  'Київ': { en: 'Kyiv', ru: 'Киев' },
  // Common surnames used in seed
  'Демо': { en: 'Demo', ru: 'Демо' },
  'BIB-2026-0487 на Audi Q7 Premium Plus очікує вашого підпису': { en: 'BIB-2026-0487 for Audi Q7 Premium Plus awaits your signature', ru: 'BIB-2026-0487 на Audi Q7 Premium Plus ожидает вашей подписи' },
  'DM Auto': { en: 'DM Auto', ru: 'DM Auto' },
  'Klaipeda, LT': { en: 'Klaipeda, LT', ru: 'Клайпеда, LT' },
  'Mercedes-Benz GLE 450 прибуло в порт': { en: 'Mercedes-Benz GLE 450 arrived at port', ru: 'Mercedes-Benz GLE 450 прибыл в порт' },
  'Near Port': { en: 'Near Port', ru: 'Возле порта' },
  'Odesa, UA': { en: 'Odesa, UA', ru: 'Одесса, UA' },
  'Olha Tkachuk': { en: 'Olha Tkachuk', ru: 'Ольга Ткачук' },
  'Tesla Model 3 доставлено': { en: 'Tesla Model 3 delivered', ru: 'Tesla Model 3 доставлена' },
  'Ірина Петренко': { en: 'Iryna Petrenko', ru: 'Ирина Петренко' },
  'Авто': { en: 'Car', ru: 'Авто' },
  'Авто завантажено на судно': { en: 'Car loaded onto vessel', ru: 'Авто загружено на судно' },
  'Автомобіль у Клайпеді. Митне оформлення розпочато.': { en: 'Car in Klaipeda. Customs clearance started.', ru: 'Автомобиль в Клайпеде. Таможенное оформление начато.' },
  'Автомобіль успішно передано. Дякуємо за вибір DM Auto!': { en: 'Car successfully handed over. Thank you for choosing DM Auto!', ru: 'Автомобиль успешно передан. Спасибо, что выбрали DM Auto!' },
  'Атлантичний океан': { en: 'Atlantic Ocean', ru: 'Атлантический океан' },
  'В дорозі': { en: 'In Transit', ru: 'В пути' },
  'Ви виграли аукціон!': { en: 'You won the auction!', ru: 'Вы выиграли аукцион!' },
  'Відплив з порту': { en: 'Departed from port', ru: 'Отплыл из порта' },
  'Депозит за': { en: 'Deposit for', ru: 'Депозит за' },
  'Депозит за Audi Q7 Premium Plus 2024': { en: 'Deposit for Audi Q7 Premium Plus 2024', ru: 'Депозит за Audi Q7 Premium Plus 2024' },
  'Договір': { en: 'Contract', ru: 'Договор' },
  'Договір BIB-2026-0312 на Mercedes-Benz GLE 450 успішно підписано': { en: 'Contract BIB-2026-0312 for Mercedes-Benz GLE 450 successfully signed', ru: 'Договор BIB-2026-0312 на Mercedes-Benz GLE 450 успешно подписан' },
  'Договір готовий до підпису': { en: 'Contract ready for signature', ru: 'Договор готов к подписанию' },
  'Договір підписано': { en: 'Contract signed', ru: 'Договор подписан' },
  'Дякуємо за вибір': { en: 'Thank you for choosing', ru: 'Спасибо, что выбрали' },
  'Дякуємо за вибір DM Auto!': { en: 'Thank you for choosing DM Auto!', ru: 'Спасибо, что выбрали DM Auto!' },
  'Завантажено на судно': { en: 'Loaded onto vessel', ru: 'Загружено на судно' },
  'Здається, ви тут вперше': { en: 'It seems you\'re new here', ru: 'Похоже, вы здесь впервые' },
  'Знайдемо машину разом': { en: 'Let\'s find a car together', ru: 'Найдём машину вместе' },
  'Контракт підписано': { en: 'Contract signed', ru: 'Контракт подписан' },
  'Лот': { en: 'Lot', ru: 'Лот' },
  'Лот Mercedes-Benz GLE 450 успішно придбано за': { en: 'Lot Mercedes-Benz GLE 450 successfully purchased for', ru: 'Лот Mercedes-Benz GLE 450 успешно приобретён за' },
  'Митне оформлення': { en: 'Customs clearance', ru: 'Таможенное оформление' },
  'Митне оформлення розпочато': { en: 'Customs clearance started', ru: 'Таможенное оформление начато' },
  'Митниця пройдена': { en: 'Customs passed', ru: 'Таможня пройдена' },
  'Наближається до порту': { en: 'Approaching port', ru: 'Приближается к порту' },
  'Олександр': { en: 'Oleksandr', ru: 'Александр' },
  'Олександр Демо': { en: 'Oleksandr Demo', ru: 'Александр Демо' },
  'Оплату отримано': { en: 'Payment received', ru: 'Оплата получена' },
  'Перевірте свої контактні дані': { en: 'Check your contact details', ru: 'Проверьте свои контактные данные' },
  'Передплата за': { en: 'Prepayment for', ru: 'Предоплата за' },
  'Передплата за Mercedes-Benz GLE 450 2023': { en: 'Advance payment for Mercedes-Benz GLE 450 2023', ru: 'Предоплата за Mercedes-Benz GLE 450 2023' },
  'Платіж': { en: 'Payment', ru: 'Платёж' },
  'Платіж INV-2026-0421 на $30,640 зараховано': { en: 'Payment INV-2026-0421 for $30,640 credited', ru: 'Платёж INV-2026-0421 на $30,640 зачислен' },
  'Платіж зараховано': { en: 'Payment credited', ru: 'Платёж зачислен' },
  'Повна оплата за': { en: 'Full payment for', ru: 'Полная оплата за' },
  'Повна оплата за BMW X5 xDrive40i 2023': { en: 'Full payment for BMW X5 xDrive40i 2023', ru: 'Полная оплата за BMW X5 xDrive40i 2023' },
  'Повна оплата за Tesla Model 3 Long Range 2022': { en: 'Full payment for Tesla Model 3 Long Range 2022', ru: 'Полная оплата за Tesla Model 3 Long Range 2022' },
  'Прибув у порт': { en: 'Arrived at port', ru: 'Прибыл в порт' },
  'Підпишіть договір': { en: 'Sign the contract', ru: 'Подпишите договор' },
  'Рахунок': { en: 'Invoice', ru: 'Счёт' },
  'Рахунок INV-2026-0312 на $19,260 — оплатіть до 23.04.2026': { en: 'Invoice INV-2026-0312 for $19,260 — pay by 23.04.2026', ru: 'Счёт INV-2026-0312 на $19,260 — оплатите до 23.04.2026' },
  'Рахунок на депозит за': { en: 'Invoice for deposit for', ru: 'Счёт на депозит за' },
  'Середина океану': { en: 'Mid-ocean', ru: 'Середина океана' },
  'Судно прибуває в порт призначення': { en: 'Vessel arriving at destination port', ru: 'Судно прибывает в порт назначения' },
  'Тесла Model 3 доставлено': { en: 'Tesla Model 3 delivered', ru: 'Тесла Model 3 доставлена' },
  'зараховано': { en: 'credited', ru: 'зачислено' },
  'оплатіть до': { en: 'pay by', ru: 'оплатите до' },
  'очікує вашого підпису': { en: 'awaits your signature', ru: 'ожидает вашей подписи' },
  'прибуло в порт': { en: 'arrived at port', ru: 'прибыл в порт' },
  'успішно передано': { en: 'successfully handed over', ru: 'успешно передан' },
  'успішно придбано за': { en: 'successfully purchased for', ru: 'успешно приобретён за' },
  'успішно підписано': { en: 'successfully signed', ru: 'успешно подписан' },
  '⚓ Прибуття в порт': { en: '⚓ Arrived at Port', ru: '⚓ Прибытие в порт' },
  '⚓ Прибуття в порт Клайпеда': { en: '⚓ Arrived at Klaipeda Port', ru: '⚓ Прибытие в порт Клайпеда' },
  '✅ Автомобіль отримано': { en: '✅ Car received', ru: '✅ Автомобиль получен' },
  '✓ Платіж зараховано': { en: '✓ Payment credited', ru: '✓ Платёж зачислен' },
  '🎉 Ви виграли аукціон!': { en: '🎉 You won the auction!', ru: '🎉 Вы выиграли аукцион!' },
  '🏁 Дякуємо за вибір DM Auto!': { en: '🏁 Thank you for choosing DM Auto!', ru: '🏁 Спасибо, что выбрали DM Auto!' },
  '🏗 Розвантаження': { en: '🏗 Unloading', ru: '🏗 Разгрузка' },
  '🏗️ Розвантаження': { en: '🏗️ Unloading', ru: '🏗️ Разгрузка' },
  '📄 Договір готовий до підпису': { en: '📄 Contract ready for signature', ru: '📄 Договор готов к подписанию' },
  '📋 Митниця пройдена': { en: '📋 Customs passed', ru: '📋 Таможня пройдена' },
  '📍 Near Port': { en: '📍 Near Port', ru: '📍 Возле порта' },
  '🚢 Mercedes-Benz GLE 450 прибуло в порт': { en: '🚢 Mercedes-Benz GLE 450 arrived at port', ru: '🚢 Mercedes-Benz GLE 450 прибыл в порт' },
};

// Sorted keys for substring replacement (longest first to win)
const SORTED_KEYS = Object.keys(SEED_DICT).sort((a, b) => b.length - a.length);

/**
 * Translate a seed string. Returns the original if unknown. Tries:
 *   1. Exact match
 *   2. Substring replacement (longest match first)
 *
 * Supported target langs: 'en', 'ru'. Legacy 'uk'/'bg'/'ua' are coerced to 'ru'.
 */
export function tSeed(text, lang) {
  if (!text || typeof text !== 'string') return text;
  let target = lang;
  if (target === 'uk' || target === 'bg' || target === 'ua') target = 'ru';
  if (target !== 'en' && target !== 'ru') return text;
  // Exact match
  const exact = SEED_DICT[text];
  if (exact && exact[target]) return exact[target];
  // Substring substitution
  let result = text;
  for (const src of SORTED_KEYS) {
    if (result.includes(src)) {
      const tr = SEED_DICT[src][target];
      if (tr) result = result.split(src).join(tr);
    }
  }
  return result;
}

const FIELD_NAMES = ['title', 'description', 'message', 'body', 'label', 'name', 'subtitle', 'text'];

/** Translate common string fields on an object. */
export function tSeedObject(obj, lang) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = { ...obj };
  for (const f of FIELD_NAMES) {
    if (typeof out[f] === 'string') {
      out[f] = tSeed(out[f], lang);
    }
  }
  return out;
}

export default tSeed;
