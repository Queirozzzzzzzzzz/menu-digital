import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { useUser } from "pages/interface";

export default function Category() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    let existingProducts = loadFromLocalStorage();

    const updateProducts = async () => {
      try {
        const selectedProductIds =
          JSON.parse(localStorage.getItem("selected_products_ids")) || [];

        existingProducts = existingProducts.filter((product) =>
          selectedProductIds.includes(product.id),
        );

        const missingProductIds = selectedProductIds.filter(
          (id) => !existingProducts.some((p) => p.id === id),
        );

        let fetchedProducts = [];
        for (const id of missingProductIds) {
          const res = await fetch(`/api/v1/products/${id}`);
          const resBody = await res.json();

          fetchedProducts.push(resBody);
        }

        for (const p of fetchedProducts) {
          p.tempId = `${new Date()}-${Math.floor(Math.random() * 4096) + 1}`;
          for (const i of p.ingredients) {
            i.tempId = `${new Date()}--${Math.floor(Math.random() * 4096) + 1}`;
            if (!i.value) i.checked = true;
          }
        }

        const combinedProducts = [...existingProducts, ...fetchedProducts];

        setProducts(combinedProducts);
        saveToLocalStorage(combinedProducts);
        setLoading(false);
      } catch (err) {
        setError("Falha ao carregar produtos. Por favor, recarregue a página.");
        setLoading(false);
      }
    };

    updateProducts();
  }, []);

  if (isLoading || loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const handleOrderSubmit = async () => {
    const now = new Date();
    const order_id = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 4096) + 1}`;
  };

  const removeProduct = (id) => {
    const updatedProducts = products.filter((product) => product.id !== id);
    const productsIds =
      JSON.parse(localStorage.getItem("selected_products_ids")) || [];
    const updatedProductsIds = productsIds.filter(
      (productId) => productId !== id,
    );
    localStorage.setItem(
      "selected_products_ids",
      JSON.stringify(updatedProductsIds),
    );

    setProducts(updatedProducts);
    saveToLocalStorage(updatedProducts);
  };

  const handleIngredientValueChange = () => {};

  const handleIngredientCheck = (productId, ingredientTempId, checked) => {
    let product = products.find((p) => p.id === productId);

    if (product) {
      const updatedIngredients = product.ingredients.map((i) =>
        i.tempId === ingredientTempId ? { ...i, checked: !checked } : i,
      );

      product.ingredients = updatedIngredients;

      const newProducts = [...products];

      const productIndex = newProducts.findIndex((p) => p.id === productId);

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

      <section className="cart-section">
        <h1 className="title">Carrinho</h1>

        {products.map((product, index) => (
          <div key={product.tempId} className="cart-item">
            <div className="product-image">
              <img src={product.picture} alt={product.name} />
            </div>

            <div className="cart-item-content">
              <button
                className="remove-product-button"
                onClick={() => removeProduct(product.id, product.tempId)}
              >
                Remover
              </button>
              <div className="product-details">
                <h2>{product.name}</h2>
              </div>

              <button className="observation-button">+ Observação</button>

              <div className="ingredients">
                {product.ingredients.map((ingredient, i) => (
                  <div key={ingredient.tempId} className="ingredient">
                    <label htmlFor={`ingredient-${ingredient.tempId}`}>
                      {ingredient.name}
                    </label>

                    {ingredient.value ? (
                      <div className="value-multiplier">
                        <input
                          type="number"
                          value={ingredient.value}
                          min="1"
                          max="100"
                          onChange={handleIngredientValueChange}
                        />
                        <button
                          onClick={() => handleIngredientValueChange("+")}
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleIngredientValueChange("-")}
                        >
                          -
                        </button>
                      </div>
                    ) : (
                      <label class="custom-checkbox">
                        <input
                          type="checkbox"
                          checked={ingredient.checked}
                          onChange={() =>
                            handleIngredientCheck(
                              product.id,
                              ingredient.tempId,
                              ingredient.checked,
                            )
                          }
                        />
                        <span class="checkmark">
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
                {product.name} - R$ {product.price}
              </li>
            ))}
          </ul>
          <div className="total">
            Total: <strong>R$</strong>
          </div>
          <button className="finish-btn btn" onClick={handleOrderSubmit}>
            AVANÇAR
          </button>
        </div>
      </section>
    </>
  );
}
