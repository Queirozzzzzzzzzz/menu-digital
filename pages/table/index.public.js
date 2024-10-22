import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { useUser } from "pages/interface";

export default function Table() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(true);

  const loadFromLocalStorage = () => {
    const orders = localStorage.getItem("orders");
    if (orders) {
      setOrder(JSON.parse(orders));
      return JSON.parse(orders);
    }

    return [];
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

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

      <h1>Mesa</h1>
    </>
  );
}
