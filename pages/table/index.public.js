import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useUser } from "pages/interface";

export default function Table() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [tableNumber, setTableNumber] = useState(1);

  const resetLocalStorage = () => {
    localStorage.setItem("orders", JSON.stringify([]));
    localStorage.setItem("products", JSON.stringify([]));
  };

  const decreaseTableNumber = () => {
    if (tableNumber > 1) setTableNumber(tableNumber - 1);
  };

  const increaseTableNumber = () => {
    setTableNumber(tableNumber + 1);
  };

  const handleConfirm = async () => {
    const orders = loadFromLocalStorage();

    try {
      const res = await fetch("/api/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orders: orders, table_number: tableNumber }),
      });

      if (res.status === 201) {
        resetLocalStorage();
        router.push("/await");
        return;
      } else {
        const resBody = await res.json();
        toast.error(resBody.message, {
          className: "alert error",
          duration: 2000,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message, {
        className: "alert error",
        duration: 2000,
      });
    }
  };

  const handleCancel = () => {
    router.push("/cart");
  };

  const loadFromLocalStorage = () => {
    const orders = localStorage.getItem("orders");
    if (orders) {
      return JSON.parse(orders);
    }

    return [];
  };

  if (isLoading) {
    return <div>Carregando...</div>;
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

      <div className="table-items">
        <h1 className="title">Selecione Sua Mesa</h1>
        <div className="table-chooser">
          <button className="table-arrow" onClick={decreaseTableNumber}>
            <img src="/static/svg/left-arrow.svg" />
          </button>
          <span>{tableNumber}</span>
          <button className="table-arrow" onClick={increaseTableNumber}>
            <img src="/static/svg/right-arrow.svg" />
          </button>
        </div>
        <div className="table-buttons">
          <button onClick={handleConfirm}>Confirmar pedido</button>
          <button onClick={handleCancel}>Voltar</button>
        </div>
      </div>
    </>
  );
}
