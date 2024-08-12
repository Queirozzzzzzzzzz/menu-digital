import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { useUser } from "pages/interface";

export default function Products() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [picture, setPicture] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [ingredientsOptions, setIngredientsOptions] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [categoriesOptions, setCategoriesOptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (router && !user && !isLoading) {
      router.push(`/login`);
    }
  }, [user, router, isLoading]);

  useEffect(() => {
    fetch("/api/v1/ingredients")
      .then((res) => res.json())
      .then((data) => {
        setIngredientsOptions(data);
      })
      .catch((error) => console.error("Error fetching ingredients:", error));
  }, []);

  useEffect(() => {
    fetch("/api/v1/categories?category_status=available")
      .then((res) => res.json())
      .then((data) => {
        setCategoriesOptions(data);
      })
      .catch((error) => console.error("Error fetching ingredients:", error));
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setPicture(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let pictureUrl = "";
      if (picture) pictureUrl = await uploadImageToImgBB(picture);

      const ingredientsIds = ingredients.map((i) => i.id);

      const res = await fetch("/api/v1/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ingredients_ids: ingredientsIds,
          name: name,
          category_id: selectedCategory.id,
          price: price,
          picture: pictureUrl,
        }),
      });

      const resBody = await res.json();

      if (res.status == 201) alert("Produto criado com sucesso");

      router.push("/admin/products");
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
    let clientId = await fetch("/api/v1/pictures");
    clientId = await clientId.json();

    const apiKey = clientId;

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: pictureFormData,
    });

    const data = await res.json();
    if (res.ok) {
      return data.data.url;
    } else {
      console.error("Failed to upload image:", data.error.message);
      throw new Error(data.error.message);
    }
  }

  return (
    <>
      <h1>Produto</h1>

      <form onSubmit={handleSubmit}>
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
        <button type="button" onClick={addIngredient}>
          Adicionar
        </button>
        <button type="submit">Criar</button>
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
