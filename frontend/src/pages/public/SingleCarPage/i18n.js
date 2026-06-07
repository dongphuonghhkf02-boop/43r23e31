/**
 * Shared EN/RU dictionary for the Single Car page family.
 *
 * Imported by every component inside `SingleCarPage/` so we have ONE source
 * of truth for labels, breadcrumb crumbs, section titles, CTA copy, toast
 * messages, aria-labels, etc. Pages call `useLang()` and then `T[lang]`.
 *
 * Conventions:
 *   • Keys are camelCase + descriptive
 *   • `ru` mirrors `en` 1:1 — never let a key be missing in RU
 *   • Toast strings are full sentences; aria-labels are concise
 */
const T = {
  en: {
    // Breadcrumb + page states
    home: 'Home',
    catalog: 'Catalog',
    vehicle: 'Vehicle',
    loading: 'Loading…',
    loadingVehicleData: 'Loading vehicle data for',
    vinNotFound: 'VIN not found',
    vinNotFoundDesc:
      "We couldn't locate {vin} in any of the connected auctions. Please double-check the VIN or try a lot number from the header search.",
    couldNotLoad: "Couldn't load this vehicle",
    unexpectedErr: 'Unexpected error format.',
    tryAgain: 'Try again',
    browseCatalog: 'Browse catalog',

    // Navigation header icons (aria)
    shareCar: 'Share car',
    addToCompare: 'Add to compare',
    removeFromCompare: 'Remove from compare',
    addToFavorites: 'Add to favorites',
    removeFromFavorites: 'Remove from favorites',

    // Image grid
    tradedChip: 'TRADED',
    vehicleInformation: 'Vehicle information',
    auctionDetails: 'Auction details',
    description: 'Description',
    brand: 'Brand',
    model: 'Model',
    year: 'Year',
    mileage: 'Mileage',
    damage: 'Damage',
    location: 'Location',
    fuel: 'Fuel',
    transmission: 'Transmission',
    bodyType: 'Body type',
    driveType: 'Drive type',
    engineVolume: 'Engine volume',
    lot: 'LOT',
    vin: 'VIN',
    auction: 'Auction',
    updated: 'Updated',
    bidPrice: 'Bid price',
    estimatedTotalPrice: 'Estimated total price',
    exactCostInBulgaria: 'exact cost in Bulgaria',
    openPhotoGallery: 'Open photo gallery',
    photo: 'Photo',
    showAllPhotos: 'Show all {count} photos',
    allImages: 'All images',
    closeGallery: 'Close gallery',
    previousPhoto: 'Previous photo',
    nextPhoto: 'Next photo',
    photoGallery: 'Photo gallery',
    galleryPagination: 'Gallery pagination',

    // Cost calculator
    costCalculatorPart1: 'Cost ',
    costCalculatorPart2: 'calculator',
    costCalculatorPart3: 'FOR THIS CAR',
    allKeyParameters:
      'All key parameters are pre-filled from the auction listing. Adjust if needed and get your total import cost to Bulgaria.',
    preFilledFromAuction: 'PRE-FILLED FROM AUCTION',
    auctionLbl: 'Auction',
    carLbl: 'Car',
    fuelTypeLbl: 'Fuel type',
    mileageLbl: 'Mileage',
    costEstimate: 'Cost Estimate',
    vehiclePurchasePrice: 'Vehicle purchase price ',
    fillTheSum: 'Fill the sum',
    auctionFee: 'Auction fee',
    carAndAuction: 'CAR & AUCTION',
    portLoadingHandling: 'Port loading & handling (USA)',
    oceanFreight: 'Ocean freight (vessel)',
    marineInsurance: 'Marine insurance',
    portHandlingBulgaria: 'Port handling in Bulgaria',
    logisticsToBulgaria: 'LOGISTICS TO BULGARIA',
    customsDuty: 'Customs duty (import tax)',
    vatBulgaria: 'VAT Bulgaria (20%)',
    bibiServiceFee: 'DM Auto service fee',
    transportToBulgaria: 'Transport to Bulgaria',
    technotest: 'Technotest (BG registration)',
    customsAndFinalFees: 'CUSTOMS & FINAL FEES',
    totalApproximateCost: 'TOTAL APPROXIMATE COST',
    approximateEstimate: 'Approximate estimate',
    approximateEstimateRest:
      '. Final cost depends on actual auction result, current freight rates and individual customs assessment. Contact DM Auto for a precise binding quote.',
    iWantCompleteCalculation: 'I want a complete calculation',

    // Navigation footer
    goBackToCatalog: 'go back to catalog',
    haveAQuestion: 'Have a question?',
    contactUs: 'Contact us',

    // Similar cars
    similarPart1: 'Similar ',
    similarPart2: 'Cars',
    previous: 'Previous',
    next: 'Next',

    // CarCard
    purchasePrice: 'Purchase price',
    engine: 'engine',
    drive: 'drive',
    estimatedFinalCostToBulgaria: 'Estimated final cost to Bulgaria:',
    moreDetails: 'More details',
    auctionTba: 'Auction TBA',
    tradingDate: 'Trading date',
    auctionPrefix: 'Auction',
    closed: 'Closed',

    // Toasts
    signInToSaveFavorites: 'Sign in to save favorites',
    signInToCompareCars: 'Sign in to compare cars',
    signInBtn: 'Sign in',
    pleaseSignInAgain: 'Please sign in again',
    addedToFavorites: 'Added to favorites',
    removedFromFavorites: 'Removed from favorites',
    addedToCompare: 'Added to compare',
    addedToCompareNeedMore: 'Added to compare',
    compareNeedMoreDesc: 'Add at least 1 more car to start comparing',
    compareReadyTitle: 'Ready to compare!',
    compareReadyDesc: '2 cars selected — open the comparison view',
    compareFullTitle: 'Compare list is full (3/3)',
    compareFullDesc: 'Open the comparison view or remove a car to add another',
    removedFromCompare: 'Removed from compare',
    openCompareBtn: 'Open compare',
    couldNotUpdateFavorites: 'Could not update favorites',
    couldNotUpdateCompare: 'Could not update compare',
  },

  ru: {
    // Breadcrumb + page states
    home: 'Главная',
    catalog: 'Каталог',
    vehicle: 'Автомобиль',
    loading: 'Загрузка…',
    loadingVehicleData: 'Загрузка данных для',
    vinNotFound: 'VIN не найден',
    vinNotFoundDesc:
      'Мы не нашли {vin} ни в одном из подключённых аукционов. Проверьте VIN ещё раз или попробуйте номер лота в шапке.',
    couldNotLoad: 'Не удалось загрузить этот автомобиль',
    unexpectedErr: 'Неожиданный формат ошибки.',
    tryAgain: 'Попробовать снова',
    browseCatalog: 'Смотреть каталог',

    // Navigation header icons (aria)
    shareCar: 'Поделиться авто',
    addToCompare: 'Добавить к сравнению',
    removeFromCompare: 'Убрать из сравнения',
    addToFavorites: 'Добавить в избранное',
    removeFromFavorites: 'Убрать из избранного',

    // Image grid
    tradedChip: 'ПРОДАН',
    vehicleInformation: 'Информация об автомобиле',
    auctionDetails: 'Детали аукциона',
    description: 'Описание',
    brand: 'Марка',
    model: 'Модель',
    year: 'Год',
    mileage: 'Пробег',
    damage: 'Повреждения',
    location: 'Локация',
    fuel: 'Топливо',
    transmission: 'КПП',
    bodyType: 'Тип кузова',
    driveType: 'Привод',
    engineVolume: 'Объём двигателя',
    lot: 'ЛОТ',
    vin: 'VIN',
    auction: 'Аукцион',
    updated: 'Обновлено',
    bidPrice: 'Текущая ставка',
    estimatedTotalPrice: 'Ориентировочная итоговая цена',
    exactCostInBulgaria: 'точная цена в Болгарии',
    openPhotoGallery: 'Открыть фотогалерею',
    photo: 'Фото',
    showAllPhotos: 'Показать все {count} фото',
    allImages: 'Все фото',
    closeGallery: 'Закрыть галерею',
    previousPhoto: 'Предыдущее фото',
    nextPhoto: 'Следующее фото',
    photoGallery: 'Фотогалерея',
    galleryPagination: 'Пагинация галереи',

    // Cost calculator
    costCalculatorPart1: 'Калькулятор ',
    costCalculatorPart2: 'стоимости',
    costCalculatorPart3: 'ЭТОГО АВТОМОБИЛЯ',
    allKeyParameters:
      'Все ключевые параметры заполнены автоматически из объявления аукциона. Скорректируйте при необходимости и узнайте общую стоимость импорта в Болгарию.',
    preFilledFromAuction: 'ЗАПОЛНЕНО ИЗ АУКЦИОНА',
    auctionLbl: 'Аукцион',
    carLbl: 'Автомобиль',
    fuelTypeLbl: 'Тип топлива',
    mileageLbl: 'Пробег',
    costEstimate: 'Оценка стоимости',
    vehiclePurchasePrice: 'Покупная цена автомобиля ',
    fillTheSum: 'Введите сумму',
    auctionFee: 'Аукционный сбор',
    carAndAuction: 'АВТО И АУКЦИОН',
    portLoadingHandling: 'Погрузка и обработка в порту (США)',
    oceanFreight: 'Морской фрахт (судно)',
    marineInsurance: 'Морская страховка',
    portHandlingBulgaria: 'Портовые сборы в Болгарии',
    logisticsToBulgaria: 'ЛОГИСТИКА ДО БОЛГАРИИ',
    customsDuty: 'Таможенная пошлина (импортный сбор)',
    vatBulgaria: 'НДС Болгария (20%)',
    bibiServiceFee: 'Сервисный сбор DM Auto',
    transportToBulgaria: 'Транспорт до Болгарии',
    technotest: 'Технический осмотр (регистрация в БГ)',
    customsAndFinalFees: 'ТАМОЖНЯ И КОНЕЧНЫЕ СБОРЫ',
    totalApproximateCost: 'ИТОГОВАЯ ПРИБЛИЗИТЕЛЬНАЯ ЦЕНА',
    approximateEstimate: 'Приблизительная оценка',
    approximateEstimateRest:
      '. Финальная цена зависит от результата аукциона, актуальных фрахтов и индивидуальной таможенной оценки. Свяжитесь с DM Auto для точного предложения.',
    iWantCompleteCalculation: 'Хочу полный расчёт',

    // Navigation footer
    goBackToCatalog: 'назад в каталог',
    haveAQuestion: 'Есть вопрос?',
    contactUs: 'Связаться с нами',

    // Similar cars
    similarPart1: 'Похожие ',
    similarPart2: 'автомобили',
    previous: 'Предыдущий',
    next: 'Следующий',

    // CarCard
    purchasePrice: 'Покупная цена',
    engine: 'двигатель',
    drive: 'привод',
    estimatedFinalCostToBulgaria: 'Ориентировочная итоговая цена в Болгарии:',
    moreDetails: 'Подробнее',
    auctionTba: 'Аукцион скоро',
    tradingDate: 'Дата торгов',
    auctionPrefix: 'Аукцион',
    closed: 'Закрыт',

    // Toasts
    signInToSaveFavorites: 'Войдите, чтобы сохранить в избранное',
    signInToCompareCars: 'Войдите, чтобы сравнивать автомобили',
    signInBtn: 'Войти',
    pleaseSignInAgain: 'Пожалуйста, войдите снова',
    addedToFavorites: 'Добавлено в избранное',
    removedFromFavorites: 'Убрано из избранного',
    addedToCompare: 'Добавлено к сравнению',
    addedToCompareNeedMore: 'Добавлено к сравнению',
    compareNeedMoreDesc: 'Добавьте ещё хотя бы 1 автомобиль для сравнения',
    compareReadyTitle: 'Готово к сравнению!',
    compareReadyDesc: 'Выбрано 2 автомобиля — откройте сравнение',
    compareFullTitle: 'Список сравнения заполнен (3/3)',
    compareFullDesc: 'Откройте сравнение или удалите авто, чтобы добавить другое',
    removedFromCompare: 'Убрано из сравнения',
    openCompareBtn: 'Открыть сравнение',
    couldNotUpdateFavorites: 'Не удалось обновить избранное',
    couldNotUpdateCompare: 'Не удалось обновить сравнение',
  },
};

export default T;

/** Convenience wrapper — returns the active language slice. */
export function useSingleCarT(lang) {
  return lang === 'ru' ? T.ru : T.en;
}
