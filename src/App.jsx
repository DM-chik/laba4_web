import DiscountCalculator from "./components/DiscountCalculator";
import "./App.css";

function App() {
    return (
        <div className="app">
            <header className="app__header">
                <h1 className="app__title">Калькулятор скидок</h1>
                <p className="app__subtitle">
                    Цена, категория, промокод и НДС — итог пересчитывается по
                    кнопке «Рассчитать».
                </p>
            </header>
            <DiscountCalculator />
        </div>
    );
}

export default App;
