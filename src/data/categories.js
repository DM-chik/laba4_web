// Справочник категорий: id, подпись и процент скидки
export const CATEGORIES = [
    { id: "electronics", label: "Электроника", discount: 5 },
    { id: "clothing", label: "Одежда", discount: 15 },
    { id: "groceries", label: "Продукты", discount: 10 },
    { id: "books", label: "Книги", discount: 20 },
    { id: "other", label: "Другое", discount: 0 },
];

// Ставка НДС в долях (22%)
export const VAT_RATE = 0.22;

// Промокоды: код → дополнительная скидка в процентах
export const PROMO_CODES = {
    WELCOME10: 10,
};
