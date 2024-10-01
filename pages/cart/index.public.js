import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { useUser } from "pages/interface";

export default function Category() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <div>Loading...</div>;
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

      <h1>Carrinho</h1>
    </>
  );
}
