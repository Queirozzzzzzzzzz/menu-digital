import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useUser } from "pages/interface";

export default function Cart() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  const handleObservationButtonClick = (product) => {
    setCurrentProduct(product);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  const handleObservationSave = (observation) => {
    let product = products.find((p) => p.tempId === currentProduct.tempId);

    let updatedProduct = {
      ...product,
      observation: observation,
    };

    const updatedProducts = [...products];
    const index = updatedProducts.findIndex(
      (p) => p.tempId === currentProduct.tempId,
    );
    if (index !== -1) {
      updatedProducts[index] = updatedProduct;
    }

    setProducts(updatedProducts);
    saveToLocalStorage(updatedProducts);
    setModalVisible(false);
  };

  const saveToLocalStorage = (pProducts) => {
    if (!pProducts) pProducts = products;
    localStorage.setItem("products", JSON.stringify(pProducts));
  };

  const loadFromLocalStorage = () => {
    const storedProducts = localStorage.getItem("products");
    if (storedProducts) {
      setProducts(JSON.parse(storedProducts));
      return JSON.parse(storedProducts);
    }

    return [];
  };

  useEffect(() => {
    const existingProducts = loadFromLocalStorage();

    setProducts(existingProducts);
    setTotal(getTotal(existingProducts));
    setLoading(false);
  }, []);

  const getTotal = (products) => {
    if (!products) return 0;

    let t = 0;
    for (const p of products) {
      t += parseFloat(p.total);
    }

    return Number(t.toFixed(2));
  };

  if (isLoading || loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const handleOrderClear = () => {
    saveToLocalStorage([]);
    setProducts([]);
    setTotal(0);
  };

  const handleOrderSubmit = async () => {
    if (products.length <= 0) {
      toast("Adicione ao menos um produto ao carrinho.", {
        className: "alert warn",
        duration: 2000,
      });
      return;
    }

    const now = new Date();
    const order_id = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 4096) + 1}`;

    let orders = [];

    for (const p of products) {
      let order = {
        order_id: order_id,
        product_id: p.id,
        price: p.total,
        observation: p.observation,
      };

      const additionalIngredients = getAdditionalIngredients(p.ingredients);
      if (additionalIngredients.length > 0)
        order = { ...order, additional_ingredients: additionalIngredients };

      const removedIngredients = getRemovedIngredients(p.ingredients);
      if (removedIngredients.length > 0)
        order = { ...order, removed_ingredients: removedIngredients };

      orders.push(order);
    }

    localStorage.setItem("orders", JSON.stringify(orders));
    router.push("/table");
  };

  const getAdditionalIngredients = (ingredients) => {
    let additionalIngredients = [];
    for (const i of ingredients) {
      if (i.extraPrice > 0) {
        const ingredient = {
          ingredient_id: i.id,
          multiplied: i.multiplied,
          price: i.extraPrice,
        };
        additionalIngredients.push(ingredient);
      }
    }

    return additionalIngredients;
  };

  const getRemovedIngredients = (ingredients) => {
    let removedIngredients = [];
    for (const i of ingredients) {
      if (i.checked !== undefined && !i.checked) removedIngredients.push(i.id);
    }

    return removedIngredients;
  };

  const removeProduct = (id) => {
    const updatedProducts = products.filter((product) => product.tempId !== id);

    setProducts(updatedProducts);
    saveToLocalStorage(updatedProducts);
    setTotal(getTotal(updatedProducts));
  };

  const handleIngredientValueChange = (
    action,
    productTempId,
    ingredientTempId,
  ) => {
    let product = products.find((p) => p.tempId === productTempId);
    let ingredient = product.ingredients.find(
      (i) => i.tempId === ingredientTempId,
    );

    if (!ingredient) {
      console.error(`Ingredient with tempId ${ingredientTempId} not found`);
      return;
    }

    let multiplied = Math.max(
      0,
      ingredient.multiplied + (action === "+" ? 1 : -1),
    );

    let multipliedValue = ingredient.value * multiplied;
    if (multiplied > 0) multipliedValue = ingredient.value + multipliedValue;

    let extraPrice = ingredient.price * multiplied;

    multipliedValue = Number(multipliedValue.toFixed(2));
    extraPrice = Number(extraPrice.toFixed(2));

    if (multiplied == 0) multipliedValue = ingredient.value;

    let updatedProduct = {
      ...product,
      ingredients: product.ingredients.map((i) =>
        i.tempId === ingredientTempId
          ? {
              ...i,
              multipliedValue: multipliedValue,
              multiplied: multiplied,
              extraPrice: extraPrice,
            }
          : i,
      ),
    };

    updatedProduct = {
      ...updatedProduct,
      total: calcProductTotal(updatedProduct),
    };

    const updatedProducts = [...products];
    const index = updatedProducts.findIndex((p) => p.tempId === productTempId);
    if (index !== -1) {
      updatedProducts[index] = updatedProduct;
    }

    setProducts(updatedProducts);
    saveToLocalStorage(updatedProducts);
    setTotal(getTotal(updatedProducts));
  };

  const calcProductTotal = (product) => {
    const price = parseFloat(product.price);

    let extraPrice = 0;
    for (const i of product.ingredients) {
      if (i.extraPrice) extraPrice += parseFloat(i.extraPrice);
    }

    const totalPrice = price + extraPrice;
    return totalPrice.toFixed(2);
  };

  const handleIngredientCheck = (productTempId, ingredientTempId, checked) => {
    let product = products.find((p) => p.tempId === productTempId);

    if (product) {
      const updatedIngredients = product.ingredients.map((i) =>
        i.tempId === ingredientTempId ? { ...i, checked: !checked } : i,
      );

      product.ingredients = updatedIngredients;

      const newProducts = [...products];

      const productIndex = newProducts.findIndex(
        (p) => p.tempId === productTempId,
      );

      if (productIndex !== -1) {
        const updatedProduct = {
          ...newProducts[productIndex],
          ingredients: newProducts[productIndex].ingredients.map(
            (ingredient) =>
              ingredient.tempId === ingredientTempId
                ? { ...ingredient, checked: !checked }
                : ingredient,
          ),
        };

        newProducts[productIndex] = updatedProduct;
      }

      saveToLocalStorage(newProducts);
      setProducts(newProducts);
    }
  };

  return (
    <>
      <header className="user-header">
        <div className="home-icon">
          <a href="/menu" rel="noopener noreferrer">
            <img id="home-icon-img" src="/static/svg/home.svg" alt="home"></img>
          </a>
        </div>

        <div className="cart-icon">
          <a href="/cart" rel="noopener noreferrer">
            <img src="/static/svg/cart.svg" alt="cart"></img>
          </a>
        </div>
      </header>

      <button className="clear-btn btn" onClick={handleOrderClear}>
        LIMPAR CARRINHO
      </button>

      <section className="cart-section">
        <h1 className="title">Carrinho</h1>

        {products.map((product, index) => (
          <div key={product.tempId} className="cart-item">
            <button
              className="remove-product-button"
              onClick={() => removeProduct(product.tempId, product.tempId)}
            >
              Remover
            </button>

            <div className="product-image">
              <img src={product.picture} alt={product.name} />
            </div>

            <div className="cart-item-content">
              <div className="product-details">
                <h2>{product.name}</h2>
              </div>

              <button
                className="observation-button"
                onClick={() => handleObservationButtonClick(product)}
              >
                + Observação
              </button>

              <p className="observation">{product.observation}</p>

              <div className="ingredients">
                {product.ingredients.map((ingredient, i) => (
                  <div key={ingredient.tempId} className="ingredient">
                    <label htmlFor={`ingredient-${ingredient.tempId}`}>
                      {ingredient.name} {ingredient.value !== null ? "(R$" : ""}{" "}
                      {ingredient.price} {ingredient.value !== null ? ")" : ""}
                    </label>

                    {ingredient.value ? (
                      <div className="value-multiplier">
                        <input
                          type="number"
                          value={ingredient.multipliedValue}
                          min="1"
                          max="100"
                          onChange={handleIngredientValueChange}
                        />
                        <button
                          onClick={() =>
                            handleIngredientValueChange(
                              "+",
                              product.tempId,
                              ingredient.tempId,
                            )
                          }
                        >
                          +
                        </button>
                        <button
                          onClick={() =>
                            handleIngredientValueChange(
                              "-",
                              product.tempId,
                              ingredient.tempId,
                            )
                          }
                        >
                          -
                        </button>
                      </div>
                    ) : (
                      <label className="custom-checkbox">
                        <input
                          type="checkbox"
                          checked={ingredient.checked}
                          onChange={() =>
                            handleIngredientCheck(
                              product.tempId,
                              ingredient.tempId,
                              ingredient.checked,
                            )
                          }
                        />
                        <span className="checkmark">
                          <img src="/static/svg/yes.svg" alt="Checked" />
                        </span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div className="summary">
          <h3 className="summary-title">Resumo</h3>
          <ul className="summary-items">
            {products.map((product) => (
              <li key={product.tempId}>
                <strong>
                  {product.name} - R$ {product.total}
                </strong>
                <ul>
                  {product.ingredients.map((ingredient, index) =>
                    ingredient.extraPrice ? (
                      <li key={index}>
                        {ingredient.multiplied} {"x "} {ingredient.name}{" "}
                        {" R$ "} {ingredient.extraPrice}
                      </li>
                    ) : ingredient.checked ? null : ingredient.value ? null : (
                      <li style={{ textDecoration: "line-through" }}>
                        {ingredient.name}
                      </li>
                    ),
                  )}
                </ul>
              </li>
            ))}
          </ul>
          <div className="total">
            Total:{" "}
            <strong>
              {"R$ "} {total}
            </strong>
          </div>
          <button className="finish-btn btn" onClick={handleOrderSubmit}>
            AVANÇAR
          </button>
        </div>
      </section>

      {modalVisible && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Observação</h2>
            <textarea
              placeholder="Escreva sua observação aqui..."
              defaultValue={currentProduct ? currentProduct.observation : ""}
              onChange={(e) =>
                setCurrentProduct({
                  ...currentProduct,
                  observation: e.target.value,
                })
              }
            />
            <button
              onClick={() => handleObservationSave(currentProduct.observation)}
            >
              Salvar
            </button>
            <button onClick={handleModalClose}>Fechar</button>
          </div>
        </div>
      )}
    </>
  );
}
