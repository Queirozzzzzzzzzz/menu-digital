import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { useUser } from "pages/interface";
import AdminHeader from "components/adminHeader";

export default function CreateIngredient() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (router && !user && !isLoading) {
      router.push(`/login`);
    }
  }, [user, router, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let reqBody = {
        name,
        ...(value && { value }),
        ...(price && { price }),
      };

      const res = await fetch("/api/v1/ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reqBody),
      });

      if (res.status == 201) {
        alert("Ingrediente criado com sucesso");
        location.reload();
      } else {
        const resBody = await res.json();
        alert(resBody.message);
      }
    } catch (err) {
      console.error("Error submiting form: ", err);
    }
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

      <section className="ingredients" id="create">
        <form onSubmit={handleSubmit}>
          <label>
            Nome:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <br />
          <label>
            Preço:
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
          <br />

          <label>
            Valor:
            <input
              type="number"
              value={value}
              onChange={(e) => {
                const inputValue = e.target.value;
                const filteredValue = inputValue.replace(/[^0-9]/g, "");
                setValue(filteredValue);
              }}
            />
          </label>

          <br />
          <button type="submit">Criar</button>
        </form>
      </section>
    </>
  );
}
