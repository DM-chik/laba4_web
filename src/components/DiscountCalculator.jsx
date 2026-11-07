import { useState } from "react";
import { CATEGORIES, VAT_RATE, PROMO_CODES } from "../data/categories";
import "./DiscountCalculator.css";

let nextItemId = 1;

function createItem() {
    return {
        id: nextItemId++,
        price: "",
        categoryId: "electronics",
    };
}

function formatRub(value) {
    return value.toLocaleString("ru-RU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function DiscountCalculator() {
    // --- Состояние ---
    // Список товаров: у каждой позиции своя цена и категория
    const [items, setItems] = useState([createItem()]);

    // Ручная скидка вместо категорийной
    const [useCustomDiscount, setUseCustomDiscount] = useState(false);
    const [customDiscount, setCustomDiscount] = useState(25);

    // Промокод: применяется только после нажатия «Применить»
    const [promoInput, setPromoInput] = useState("");
    const [promo, setPromo] = useState(null); // { code, percent }
    const [promoError, setPromoError] = useState("");

    // НДС можно выключить
    const [withVat, setWithVat] = useState(true);

    // Ошибки валидации по id товара
    const [errors, setErrors] = useState({});

    // Результат последнего расчёта (null — ещё не считали)
    const [result, setResult] = useState(null);

    // История последних 5 расчётов
    const [history, setHistory] = useState([]);

    // --- Работа со списком товаров ---
    function updateItem(id, patch) {
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        );
        setErrors((prev) => ({ ...prev, [id]: "" }));
        setResult(null);
    }

    function handlePriceChange(id, value) {
        // Разрешаем пустую строку, целые числа и числа с одной точкой
        if (value === "" || /^\d*\.?\d*$/.test(value)) {
            updateItem(id, { price: value });
        }
    }

    function handleCategoryChange(id, value) {
        updateItem(id, { categoryId: value });
    }

    function addItem() {
        setItems((prev) => [...prev, createItem()]);
        setResult(null);
    }

    function removeItem(id) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
        setResult(null);
    }

    // --- Промокод ---
    function handleApplyPromo() {
        const code = promoInput.trim().toUpperCase();

        if (!code) {
            setPromo(null);
            setPromoError("Введите промокод");
            return;
        }

        if (PROMO_CODES[code] === undefined) {
            setPromo(null);
            setPromoError("Промокод не найден");
            return;
        }

        setPromo({ code, percent: PROMO_CODES[code] });
        setPromoError("");
        setResult(null);
    }

    function handleRemovePromo() {
        setPromo(null);
        setPromoInput("");
        setPromoError("");
        setResult(null);
    }

    // --- Расчёт ---
    function handleCalculate() {
        const nextErrors = {};
        const rows = [];

        items.forEach((item) => {
            const price = parseFloat(item.price);
            const category = CATEGORIES.find((c) => c.id === item.categoryId);

            if (!item.price.trim()) {
                nextErrors[item.id] = "Введите цену товара";
                return;
            }
            if (Number.isNaN(price) || price <= 0) {
                nextErrors[item.id] = "Цена должна быть положительным числом";
                return;
            }

            const percent = useCustomDiscount
                ? customDiscount
                : category.discount;
            const discountAmount = (price * percent) / 100;

            rows.push({
                id: item.id,
                price,
                categoryLabel: category.label,
                percent,
                discountAmount,
                priceAfterDiscount: price - discountAmount,
            });
        });

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            setResult(null);
            return;
        }

        const subtotal = rows.reduce((sum, row) => sum + row.price, 0);
        const discountTotal = rows.reduce(
            (sum, row) => sum + row.discountAmount,
            0,
        );
        const afterDiscount = subtotal - discountTotal;

        const promoPercent = promo ? promo.percent : 0;
        const promoAmount = (afterDiscount * promoPercent) / 100;
        const taxableBase = afterDiscount - promoAmount;
        const vatAmount = withVat ? taxableBase * VAT_RATE : 0;
        const total = taxableBase + vatAmount;

        const snapshot = {
            rows,
            subtotal,
            discountTotal,
            afterDiscount,
            promoCode: promo ? promo.code : null,
            promoPercent,
            promoAmount,
            taxableBase,
            withVat,
            vatAmount,
            total,
            createdAt: new Date(),
        };

        setResult(snapshot);
        setHistory((prev) => [
            {
                id: Date.now(),
                itemsCount: rows.length,
                total,
                promoCode: snapshot.promoCode,
            },
            ...prev,
        ].slice(0, 5));
    }

    function handleReset() {
        setItems([createItem()]);
        setUseCustomDiscount(false);
        setCustomDiscount(25);
        setPromoInput("");
        setPromo(null);
        setPromoError("");
        setWithVat(true);
        setErrors({});
        setResult(null);
    }

    return (
        <div className="calculator">
            <section className="panel">
                <div className="panel__head">
                    <h2 className="panel__title">Товары</h2>
                    <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={addItem}
                    >
                        + Добавить товар
                    </button>
                </div>

                <div className="items">
                    {items.map((item, index) => (
                        <div className="item" key={item.id}>
                            <div className="field item__price">
                                <label
                                    className="field__label"
                                    htmlFor={`price-${item.id}`}
                                >
                                    Цена товара {index + 1} (₽)
                                </label>
                                <input
                                    id={`price-${item.id}`}
                                    type="text"
                                    inputMode="decimal"
                                    className={
                                        errors[item.id]
                                            ? "field__input field__input--error"
                                            : "field__input"
                                    }
                                    value={item.price}
                                    onChange={(e) =>
                                        handlePriceChange(
                                            item.id,
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Например: 1000"
                                />
                                {errors[item.id] && (
                                    <span className="field__error">
                                        {errors[item.id]}
                                    </span>
                                )}
                            </div>

                            <div className="field item__category">
                                <label
                                    className="field__label"
                                    htmlFor={`category-${item.id}`}
                                >
                                    Категория
                                </label>
                                <select
                                    id={`category-${item.id}`}
                                    className="field__input field__select"
                                    value={item.categoryId}
                                    onChange={(e) =>
                                        handleCategoryChange(
                                            item.id,
                                            e.target.value,
                                        )
                                    }
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.label} — скидка {cat.discount}%
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="button"
                                className="item__remove"
                                onClick={() => removeItem(item.id)}
                                disabled={items.length === 1}
                                title="Удалить товар"
                                aria-label={`Удалить товар ${index + 1}`}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            <section className="panel">
                <h2 className="panel__title">Скидки и налоги</h2>

                <div className="options">
                    <label className="checkbox">
                        <input
                            type="checkbox"
                            checked={useCustomDiscount}
                            onChange={(e) => {
                                setUseCustomDiscount(e.target.checked);
                                setResult(null);
                            }}
                        />
                        <span>Своя скидка вместо категорийной</span>
                    </label>

                    <div
                        className={
                            useCustomDiscount
                                ? "slider"
                                : "slider slider--disabled"
                        }
                    >
                        <div className="slider__head">
                            <label htmlFor="custom-discount">
                                Размер скидки
                            </label>
                            <span className="slider__value">
                                {customDiscount}%
                            </span>
                        </div>
                        <input
                            id="custom-discount"
                            type="range"
                            min="0"
                            max="50"
                            step="1"
                            value={customDiscount}
                            disabled={!useCustomDiscount}
                            onChange={(e) => {
                                setCustomDiscount(Number(e.target.value));
                                setResult(null);
                            }}
                        />
                    </div>

                    <label className="checkbox">
                        <input
                            type="checkbox"
                            checked={withVat}
                            onChange={(e) => {
                                setWithVat(e.target.checked);
                                setResult(null);
                            }}
                        />
                        <span>Начислять НДС 22%</span>
                    </label>
                </div>

                <div className="promo">
                    <div className="field promo__field">
                        <label className="field__label" htmlFor="promo">
                            Промокод
                        </label>
                        <div className="promo__row">
                            <input
                                id="promo"
                                type="text"
                                className={
                                    promoError
                                        ? "field__input field__input--error"
                                        : "field__input"
                                }
                                value={promoInput}
                                onChange={(e) => {
                                    setPromoInput(e.target.value);
                                    setPromoError("");
                                }}
                                placeholder="Например: WELCOME10"
                            />
                            <button
                                type="button"
                                className="btn btn--ghost"
                                onClick={handleApplyPromo}
                            >
                                Применить
                            </button>
                        </div>
                        {promoError && (
                            <span className="field__error">{promoError}</span>
                        )}
                        {promo && (
                            <span className="promo__applied">
                                Промокод {promo.code} даёт −{promo.percent}%
                                <button
                                    type="button"
                                    className="promo__remove"
                                    onClick={handleRemovePromo}
                                >
                                    убрать
                                </button>
                            </span>
                        )}
                    </div>
                </div>
            </section>

            <div className="actions">
                <button
                    type="button"
                    className="btn btn--primary"
                    onClick={handleCalculate}
                >
                    Рассчитать
                </button>
                <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={handleReset}
                >
                    Сбросить
                </button>
            </div>

            {result && (
                <section className="results" aria-live="polite">
                    <h2 className="results__title">Результат расчёта</h2>

                    <table className="results__table">
                        <tbody>
                            {result.rows.map((row, index) => (
                                <tr key={row.id} className="results__row--item">
                                    <td>
                                        Товар {index + 1} ·{" "}
                                        {row.categoryLabel} · скидка{" "}
                                        {row.percent}%
                                    </td>
                                    <td className="results__value">
                                        {formatRub(row.price)} ₽ −{" "}
                                        {formatRub(row.discountAmount)} ₽
                                    </td>
                                </tr>
                            ))}

                            <tr>
                                <td>Сумма без скидки</td>
                                <td className="results__value">
                                    {formatRub(result.subtotal)} ₽
                                </td>
                            </tr>
                            <tr>
                                <td>Скидка по категориям</td>
                                <td className="results__value results__value--discount">
                                    −{formatRub(result.discountTotal)} ₽
                                </td>
                            </tr>
                            {result.promoCode && (
                                <tr>
                                    <td>
                                        Промокод {result.promoCode} (−
                                        {result.promoPercent}%)
                                    </td>
                                    <td className="results__value results__value--discount">
                                        −{formatRub(result.promoAmount)} ₽
                                    </td>
                                </tr>
                            )}
                            <tr>
                                <td>Сумма после всех скидок</td>
                                <td className="results__value">
                                    {formatRub(result.taxableBase)} ₽
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    НДС {result.withVat ? "22%" : "(не начисляется)"}
                                </td>
                                <td className="results__value">
                                    {result.withVat
                                        ? `+${formatRub(result.vatAmount)} ₽`
                                        : "0,00 ₽"}
                                </td>
                            </tr>
                            <tr className="results__row--total">
                                <td>Итого к оплате</td>
                                <td className="results__value">
                                    {formatRub(result.total)} ₽
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </section>
            )}

            {history.length > 0 && (
                <section className="history">
                    <h2 className="history__title">Последние расчёты</h2>
                    <ul className="history__list">
                        {history.map((entry) => (
                            <li className="history__item" key={entry.id}>
                                <span>
                                    {entry.itemsCount}{" "}
                                    {entry.itemsCount === 1
                                        ? "товар"
                                        : entry.itemsCount < 5
                                          ? "товара"
                                          : "товаров"}
                                    {entry.promoCode
                                        ? ` · ${entry.promoCode}`
                                        : ""}
                                </span>
                                <strong>{formatRub(entry.total)} ₽</strong>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}

export default DiscountCalculator;
