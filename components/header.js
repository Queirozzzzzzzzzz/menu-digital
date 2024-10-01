import React from "react";

const Header = () => {
  return (
    <header className="user-header">
      <div className="home-icon">
        <a href="/menu" rel="noopener noreferrer">
          <img src="/static/svg/home.svg" alt="home" width="40" height="40"></img>
        </a>
      </div>

      <div className="cart-icon">
        <a href="/cart" rel="noopener noreferrer">
          <img src="/static/svg/cart.svg" alt="cart" width="45" height="45"></img>
        </a>
      </div>
    </header>
  );
};

export default Header;
