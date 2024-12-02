import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
          setError("Falha ao carregar produtos.");
          return;
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

  if (isLoading || loading) {
    return (
      <>
        <header className="user-header">
          <div className="home-icon">
            <a href="/menu" rel="noopener noreferrer">
              <img
                id="home-icon-img"
                src="/static/svg/home.svg"
                alt="home"
              ></img>
            </a>
          </div>

          <div className="cart-icon">
            <a href="/cart" rel="noopener noreferrer">
              <img src="/static/svg/cart.svg" alt="cart"></img>
            </a>
          </div>
        </header>

        <div>Carregando...</div>
      </>
    );
  }

  if (error) {
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

      <div className="error">{error}</div>
    </>;
  }

  const handleProductAdd = async (productId) => {
    try {
      const res = await fetch(`/api/v1/products/${productId}`);
      const product = await res.json();

      product.tempId = `${new Date()}-${Math.floor(Math.random() * 4096) + 1}`;
      product.total = product.price;
      for (const i of product.ingredients) {
        i.tempId = `${new Date()}--${Math.floor(Math.random() * 4096) + 1}`;
        if (!i.value) {
          i.checked = true;
        } else {
          i.multipliedValue = i.value;
          i.multiplied = 0;
          i.extraPrice = 0;
        }
      }

      let products = JSON.parse(localStorage.getItem("products")) || [];
      products.push(product);

      localStorage.setItem("products", JSON.stringify(products));
      toast.success("Produto adicionado ao carrinho.", {
        className: "alert success",
        duration: 1000,
      });
    } catch (error) {
      console.error("Error handling product addition:", error);
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

      <section className="home" id="home">
        <h1 className="title">Produtos</h1>
        {products.map((product, index) => (
          <div
            className={`${index % 2 === 0 ? "card-1" : "card-2"}`}
            key={product.id}
          >
            {index % 2 === 0 ? (
              <>
                <div className="image-container">
                  <img
                    src={product.picture}
                    className={product.status === "missing" ? "missing" : ""}
                    alt="Product"
                  />
                  {product.status === "missing" && (
                    <span className="missing-text">Em falta</span>
                  )}
                </div>

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

                <div className="image-container">
                  <img
                    src={product.picture}
                    className={product.status === "missing" ? "missing" : ""}
                    alt="Product"
                  />
                  {product.status === "missing" && (
                    <span className="missing-text">Em falta</span>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </section>
    </>
  );
}
