import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { useUser } from "pages/interface";

export default function Category() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getProducts = async () => {
      try {
        const res = await fetch(
          `/api/v1/products?category=${router.query.category}&product_status=available,missing`,
          {
            method: "GET",
          },
        );

        if (!res.ok) {
          throw new Error("Network response was not ok");
        }

        const resBody = await res.json();
        setProducts(resBody);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (router.query.category) {
      getProducts();
    }
  }, [router.query.category]);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  const handleProductAdd = (productId) => {
    try {
      let selectedProducts =
        JSON.parse(localStorage.getItem("selected_products_ids")) || [];

      selectedProducts.push(productId);

      localStorage.setItem(
        "selected_products_ids",
        JSON.stringify(selectedProducts),
      );
    } catch (error) {
      console.error("Error handling product addition:", error);

      localStorage.setItem(
        "selected_products_ids",
        JSON.stringify([productId]),
      );
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

      <section className="home" id="home">
        <h1 className="title">Produtos</h1>
        {products.map((product, index) => (
          <div
            className={`${index % 2 === 0 ? "card-1" : "card-2"}`}
            key={product.id}
          >
            {index % 2 === 0 ? (
              <>
                <img src={product.picture} />
                <div className="info">
                  <h1 className="title">{product.name}</h1>
                  <p className="text">
                    Preço: {product.price} <br />
                    Ingredientes:{" "}
                    {product.ingredients
                      .map((ingredient) => ingredient.name)
                      .join(", ")}
                  </p>
                  <button
                    className="btn"
                    onClick={() => handleProductAdd(product.id)}
                    disabled={product.status != "available"}
                  >
                    Adicionar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="info">
                  <h1 className="title">{product.name}</h1>
                  <p className="text">
                    Preço: {product.price} <br />
                    Ingredientes:{" "}
                    {product.ingredients
                      .map((ingredient) => ingredient.name)
                      .join(", ")}
                  </p>
                  <button
                    className="btn"
                    onClick={() => handleProductAdd(product.id)}
                    disabled={product.status != "available"}
                  >
                    Adicionar
                  </button>
                </div>
                <img src={product.picture} />
              </>
            )}
          </div>
        ))}
      </section>
    </>
  );
}
