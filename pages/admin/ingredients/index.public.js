import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { useUser } from "pages/interface";
import AdminHeader from "components/adminHeader";

export default function Ingredients() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  const [ingredients, setIngredients] = useState([]);

  useEffect(() => {
    if (router && !user && !isLoading) {
      router.push(`/login`);
    }
  }, [user, router, isLoading]);

  const fetchIngredients = async () => {
    fetch("/api/v1/ingredients")
      .then((res) => res.json())
      .then((data) => {
        setIngredients(Array.isArray(data) ? data : []);
      })
      .catch((error) => console.error("Error fetching ingredients:", error));
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleEditBtn = (ingredientId) => {
    router.push(`/admin/ingredients/edit/${ingredientId}`);
  };

  return (
    <>
      <AdminHeader />

      <section className="sub-header">
        <nav>
          <div className="menu-item">
            <a href="/admin/ingredients/create" rel="noopener noreferrer">
              <p>ADICIONAR</p>
            </a>
          </div>

          <div className="menu-item">
            <a href="/admin/ingredients" rel="noopener noreferrer">
              <p>LISTAR</p>
            </a>
          </div>
        </nav>
      </section>

      <section className="ingredients" id="list">
        {ingredients.length === 0 ? (
          <p>Nenhum ingrediente foi encontrado.</p>
        ) : (
          ingredients.map((ingredient) => (
            <>
              <img src={ingredient.picture} />
              <div className="info">
                <p className="text">
                  Nome: {ingredient.name} <br />
                  {ingredient.value && (
                    <span>Valor: {ingredient.value}</span>
                  )}{" "}
                  {ingredient.price && <span>Preço: {ingredient.price}</span>}{" "}
                </p>
                <button
                  className="btn"
                  onClick={() => handleEditBtn(ingredient.id)}
                >
                  Editar
                </button>
              </div>
            </>
          ))
        )}
      </section>
    </>
  );
}
