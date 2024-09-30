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
    return <div>Loading...</div>;
  }

  return (
    <>
      <section className="home" id="home">
        {products.map((product, index) => (
          <div
            className={`${index % 2 === 0 ? "card-1" : "card-2"}`}
            key={product.id}
          >
            <div className="home-container-sale">
              <div className="info">
                <h1 className="title">{product.name}</h1>
                <p className="text">
                  Preço: {product.price} <br />
                  Ingredientes:{" "}
                  {product.ingredients
                    .map((ingredient) => ingredient.name)
                    .join(", ")}
                </p>
                <div className="btn">Adicionar ao Carrinho</div>
              </div>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
