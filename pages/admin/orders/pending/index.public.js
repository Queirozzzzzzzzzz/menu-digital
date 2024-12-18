import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useUser } from "pages/interface";
import AdminHeader from "components/adminHeader";

export default function PendingOrders() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (router && !user && !isLoading) {
      router.push(`/login`);
    }

    if (router && user) fetchOrders();
  }, [user, router, isLoading]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/v1/orders?order_status=pending");
      const data = await res.json();

      let updatedData = [];
      data.map((o) => {
        if (o.observation) o.product[0].observation = o.observation;

        if (o.additional_ingredients.length > 0) {
          o.product[0].additional_ingredients = o.additional_ingredients;
        }

        if (o.removed_ingredients.length > 0) {
          o.product[0].removed_ingredients = o.removed_ingredients;
        }

        delete o.observation;
        delete o.additional_ingredients;
        delete o.removed_ingredients;

        updatedData.push(o);
      });

      const groupedOrders = updatedData.reduce((acc, order) => {
        const orderId = order.order_id;

        if (!acc[orderId]) {
          acc[orderId] = { ...order };
        } else {
          // Combine product information
          if (order.product.length && acc[orderId].product.length) {
            const combinedProduct = [...acc[orderId].product, ...order.product];
            acc[orderId].product = Array.from(
              new Set(combinedProduct.map((p) => JSON.stringify(p))),
            ).map((s) => JSON.parse(s));
          }

          // Combine additional_ingredients information
          if (
            order.product[0]?.additional_ingredients?.length &&
            acc[orderId].product[0]?.additional_ingredients?.length
          ) {
            const combinedAdditionalIngredients = [
              ...acc[orderId].product[0].additional_ingredients,
              ...order.product[0].additional_ingredients,
            ];
            acc[orderId].product[0].additional_ingredients = Array.from(
              new Set(
                combinedAdditionalIngredients.map((i) => JSON.stringify(i)),
              ),
            ).map((s) => JSON.parse(s));
          }

          // Combine removed_ingredients information
          if (
            order.product[0]?.removed_ingredients?.length &&
            acc[orderId].product[0]?.removed_ingredients?.length
          ) {
            const combinedRemovedIngredients = [
              ...new Set([
                ...acc[orderId].product[0].removed_ingredients,
                ...order.product[0].removed_ingredients,
              ]),
            ];
            acc[orderId].product[0].removed_ingredients =
              combinedRemovedIngredients;
          }
        }

        return acc;
      }, {});

      const result = Object.values(groupedOrders);

      setOrders(result);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const handleAccept = async (orderId) => {
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order_status: ["accepted"] }),
      });

      if (res.status == 200) {
        toast.success("Pedido aceito com sucesso!", {
          className: "alert success",
          duration: 2000,
        });
        fetchOrders();
      } else {
        const resBody = await res.json();
        toast.error(resBody.message, {
          className: "alert error",
          duration: 2000,
        });
      }
    } catch (err) {
      console.error("Error submiting form: ", err);
    }
  };

  const handleReject = async (orderId) => {
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order_status: ["declined"] }),
      });

      if (res.status == 200) {
        toast.success("Pedido negado com sucesso!", {
          className: "alert success",
          duration: 2000,
        });
        fetchOrders();
      } else {
        const resBody = await res.json();
        toast.error(resBody.message, {
          className: "alert error",
          duration: 2000,
        });
      }
    } catch (err) {
      console.error("Error submiting form: ", err);
    }
  };

  return (
    <>
      <AdminHeader />

      <section className="sub-header orders">
        <nav>
          <div className="menu-item">
            <a href="/admin/orders/pending" rel="noopener noreferrer">
              <p>PENDENTES</p>
            </a>
          </div>

          <div className="menu-item">
            <a href="/admin/orders/accepted" rel="noopener noreferrer">
              <p>ACEITOS</p>
            </a>
          </div>

          <div className="menu-item">
            <a href="/admin/orders/finished" rel="noopener noreferrer">
              <p>FINALIZADOS</p>
            </a>
          </div>
        </nav>
      </section>

      <section className="orders" id="list">
        {orders.length === 0 ? (
          <p>Nenhum pedido foi encontrado.</p>
        ) : (
          orders.map((o) => (
            <div className="order-card" key={o.id}>
              <div className="order-info">
                <p className="text">
                  <strong>MESA {o.table_number}</strong> <br />
                  {o.product.map((product, index) => (
                    <div key={index}>
                      {product.name}
                      <br />
                      {product.additional_ingredients &&
                        product.additional_ingredients.length > 0 && (
                          <>
                            <h5>Adicionais</h5>
                            {product.additional_ingredients.map(
                              (i, ingredientIndex) => (
                                <div
                                  key={ingredientIndex}
                                  className="ingredient"
                                >
                                  {i.multiplied}x {i.name}
                                  <br />
                                </div>
                              ),
                            )}
                          </>
                        )}
                      {product.removed_ingredients &&
                        product.removed_ingredients.map(
                          (i, ingredientIndex) => (
                            <div
                              key={ingredientIndex}
                              className="ingredient removed"
                            >
                              {i.name}
                              <br />
                            </div>
                          ),
                        )}
                      {product.observation && (
                        <div className="ingredient">
                          <span>Observação: {product.observation}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <h4>Total</h4>
                  {"R$ "} {parseFloat(o.price).toFixed(2)}
                </p>
                <div className="order-actions">
                  <button
                    className="accept-button"
                    onClick={() => handleAccept(o.order_id)}
                  >
                    ACEITAR
                  </button>
                  <button
                    className="reject-button"
                    onClick={() => handleReject(o.order_id)}
                  >
                    NEGAR
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
