import React from "react";

const AdminHeader = () => {
  return (
    <header className="admin-header">
      <nav>
        <div className="menu-item">
          <a href="/admin/orders" rel="noopener noreferrer">
            <p>PEDIDOS</p>
          </a>
        </div>

        <div className="menu-item">
          <a href="/admin/products" rel="noopener noreferrer">
            <p>PRODUTOS</p>
          </a>
        </div>

        <div className="menu-item">
          <a href="/admin/ingredients" rel="noopener noreferrer">
            <p>INGREDIENTES</p>
          </a>
        </div>

        <div className="menu-item">
          <a href="/admin/statistics" rel="noopener noreferrer">
            <p>ESTATÍSTICAS</p>
          </a>
        </div>
      </nav>
    </header>
  );
};

export default AdminHeader;
