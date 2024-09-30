import { useRouter } from "next/router";
import { useEffect } from "react";

import { useUser } from "pages/interface";

export default function Menu() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {}, [user, router, isLoading]);

  const menuItems = [
    {
      src: "/static/img/coffees.webp",
      text: "CAFÉS",
      url: "category/coffees",
    },
    {
      src: "/static/img/sweets.webp",
      text: "DOCES",
      url: "category/sweets",
    },
    {
      src: "/static/img/snacks.webp",
      text: "SALGADOS",
      url: "category/snacks",
    },
    {
      src: "/static/img/teas.webp",
      text: "CHÁS",
      url: "category/teas",
    },
  ];

  return (
    <>
      <div className="home-container-sale">
        <div className="content-container">
          <h1 className="text-container">
            CAFÉ GELADO <br /> R$ 74,00
          </h1>
          <div className="home-btn-container">
            <button className="btn cart-btn">Adicionar ao Carrinho</button>
          </div>
        </div>
      </div>
      <ul className="menu-navigation">
        {menuItems.map((item, index) => (
          <a key={index} href={item.url} className="item">
            <img src={item.src} className="item-img" />
            <div className="item-content">{item.text}</div>
          </a>
        ))}
      </ul>
    </>
  );
}
