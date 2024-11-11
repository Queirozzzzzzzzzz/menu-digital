import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { useUser } from "pages/interface";
import AdminHeader from "components/adminHeader";

export default function Products() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (router && !user && !isLoading) {
      router.push(`/login`);
    }
  }, [user, router, isLoading]);

  const fetchProducts = async () => {
    try {
      const [coffeeRes, snackRes, sweetRes, teaRes] = await Promise.all([
        fetch(
          "/api/v1/products?category=coffees&product_status=available,missing,disabled",
        ),
        fetch(
          "/api/v1/products?category=snacks&product_status=available,missing,disabled",
        ),
        fetch(
          "/api/v1/products?category=sweets&product_status=available,missing,disabled",
        ),
        fetch(
          "/api/v1/products?category=teas&product_status=available,missing,disabled",
        ),
      ]);

      const coffeeData = await coffeeRes.json();
      const snackData = await snackRes.json();
      const sweetData = await sweetRes.json();
      const teaData = await teaRes.json();

      const tempProducts = [
        ...coffeeData,
        ...snackData,
        ...sweetData,
        ...teaData,
      ];

      setProducts(tempProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEditBtn = (productId) => {
    router.push(`/admin/products/edit/${productId}`);
  };

  return (
    <>
      <AdminHeader />

      <section className="sub-header">
        <nav>
          <div className="menu-item">
            <a href="/admin/products/create" rel="noopener noreferrer">
              <p>ADICIONAR</p>
            </a>
          </div>

          <div className="menu-item">
            <a href="/admin/products" rel="noopener noreferrer">
              <p>LISTAR</p>
            </a>
          </div>
        </nav>
      </section>

      <section className="products" id="list">
        {products.length === 0 ? (
          <p>Nenhum produto foi encontrado.</p>
        ) : (
          products.map((p) => (
            <div className={`card-1 ${p.status}`} key={p.id}>
              <>
                <img src={p.picture} />
                <div className="info">
                  <p className="text">
                    Nome: {p.name} <br />
                    Preço: {p.price} <br />
                    Ingredientes:{" "}
                    {p.ingredients
                      .map((ingredient) => ingredient.name)
                      .join(", ")}
                  </p>
                  <button className="btn" onClick={() => handleEditBtn(p.id)}>
                    Editar
                  </button>
                </div>
              </>
            </div>
          ))
        )}
      </section>
    </>
  );
}
