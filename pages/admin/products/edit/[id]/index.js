import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { useUser } from "pages/interface";

export default function Products() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const productId = router.query.id;

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [pictureUrl, setPictureUrl] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [ingredientsOptions, setIngredientsOptions] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [categoriesOptions, setCategoriesOptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [productStatus, setProductStatus] = useState("available");

  useEffect(() => {
    if (router && !user && !isLoading) {
      router.push(`/login`);
    }
  }, [user, router, isLoading]);

  useEffect(() => {
    fetch("/api/v1/ingredients")
      .then((res) => res.json())
      .then((data) => {
        setIngredientsOptions(Array.isArray(data) ? data : []);
      })
      .catch((error) => console.error("Error fetching ingredients:", error));
  }, []);

  useEffect(() => {
    fetch("/api/v1/categories?category_status=available")
      .then((res) => res.json())
      .then((data) => {
        setCategoriesOptions(Array.isArray(data) ? data : []);
      })
      .catch((error) => console.error("Error fetching ingredients:", error));
  }, []);

  useEffect(() => {
    if (!productId) return;
    fetch(`/api/v1/products/${productId}`)
      .then((res) => {
        if (res.status !== 200) {
          router.push("/");
          return null;
        }

        return res.json();
      })
      .then((data) => {
        if (!data) return;

        setName(data.name);
        setPrice(data.price);
        setPictureUrl(data.picture);
        setIngredients((prev) => {
          const existingIds = new Set(prev.map(({ id }) => id));
          const newIngredients = data.ingredients.filter(
            ({ id }) => !existingIds.has(id),
          );
          return [...prev, ...newIngredients];
        });
        setSelectedCategory({ id: data.category_id });
        setProductStatus(data.status || "available");
      })
      .catch((error) => console.error("Error fetching ingredients:", error));
  }, [productId]);

  const handleFileChange = async (e) => {
    if (e.target.files.length > 0) {
      setPictureUrl(await uploadImageToImgBB(e.target.files[0]));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const ingredientsIds = ingredients.map((i) => i.id);

      const res = await fetch(`/api/v1/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ingredients_ids: ingredientsIds,
          name: name,
          category_id: selectedCategory.id,
          price: price,
          picture: pictureUrl,
          product_status: [productStatus],
        }),
      });

      if (res.status == 200) {
        alert("Produto atualizado com sucesso");
        location.reload();
      }
    } catch (err) {
      console.error("Error submiting form: ", err);
    }
  };

  const handleCategoryChange = (e) => {
    const selectedOption = {
      id: parseInt(e.target.value),
    };
    setSelectedCategory(selectedOption);
  };

  const handleIngredientChange = (e) => {
    const selectedOption = {
      id: parseInt(e.target.value),
      name: e.target.options[e.target.selectedIndex].text,
    };
    setSelectedIngredient(selectedOption);
  };

  function addIngredient(e) {
    if (
      selectedIngredient &&
      !ingredients.some((ing) => ing.id === selectedIngredient.id)
    ) {
      setIngredients((prevIngredients) => [
        ...prevIngredients,
        selectedIngredient,
      ]);
    }
  }

  const removeIngredient = (id) => {
    setIngredients((prevIngredients) =>
      prevIngredients.filter((ingredient) => ingredient.id !== id),
    );
  };

  async function uploadImageToImgBB(picture) {
    const pictureFormData = new FormData();
    pictureFormData.append("image", picture);
    let clientIdRes = await fetch("/api/v1/pictures");
    if (clientIdRes.status !== 200) {
      console.error("Error fetching api key from /api/v1/pictures");
      return;
    }

    const apiKey = await clientIdRes.json();

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: pictureFormData,
    });

    const resBody = await res.json();
    if (res.ok) {
      return resBody.data.url;
    } else {
      console.error(resBody);
      alert("Falha ao salvar imagem. Verifique o tamanho/formato.");
      return;
    }
  }

  return (
    <>
      <h1>Editar Produto</h1>

      <form onSubmit={handleSubmit}>
        <img src={`${pictureUrl}`} />
        <label>
          Imagem:
          <input type="file" onChange={handleFileChange} />
        </label>
        <br />
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
            required
          />
        </label>
        <br />
        <label>
          Categoria:
          <select
            value={selectedCategory?.id || ""}
            onChange={handleCategoryChange}
          >
            <option value="" disabled>
              Selecione a categoria
            </option>
            {categoriesOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <br />
        <label>
          Ingrediente:
          <select
            value={selectedIngredient?.id || ""}
            onChange={handleIngredientChange}
          >
            <option value="" disabled>
              Selecione um ingrediente
            </option>
            {ingredientsOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <br />
        <label>
          Status:
          <select
            value={productStatus}
            onChange={(e) => setProductStatus(e.target.value)}
          >
            <option value="available">Available</option>
            <option value="missing">Missing</option>
            <option value="disabled">Disabled</option>
          </select>
        </label>
        <br />
        <button type="button" onClick={addIngredient}>
          Adicionar
        </button>
        <button type="submit">Atualizar</button>
      </form>

      <h2>Selected Ingredients</h2>
      <ul>
        {ingredients.map((ingredient) => (
          <li key={ingredient.id}>
            {ingredient.name}{" "}
            <button onClick={() => removeIngredient(ingredient.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
