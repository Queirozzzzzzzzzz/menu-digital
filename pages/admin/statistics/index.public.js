import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useUser } from "pages/interface";
import AdminHeader from "components/adminHeader";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function Statistics() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [orderQuantityData, setOrderQuantityData] = useState([]);
  const [productQuantityData, setProductQuantityData] = useState([]);

  useEffect(() => {
    if (router && !user && !isLoading) {
      router.push(`/login`);
    }

    if (router && user) fetchOrders();
  }, [user, router, isLoading]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/v1/orders?order_status=finished");
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
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (orders.length <= 0) return;

    // Order quantity
    const countOrderQuantityValues = () => {
      const counts = Array(12).fill(0);

      orders.forEach(({ created_at }) => {
        const date = new Date(created_at);
        const month = date.getMonth();
        counts[month]++;
      });

      const categories = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
      ];

      return { data: counts, categories: categories };
    };

    const orderQuantityValues = countOrderQuantityValues();

    const orderQuantityOptions = {
      options: {
        chart: {
          type: "line",
          height: 380,
        },
        xaxis: {
          categories: orderQuantityValues.categories,
        },
        responsive: [
          {
            breakpoint: 480,
            options: {
              chart: {
                height: 300,
              },
              legend: {
                position: "bottom",
              },
            },
          },
        ],
      },
      series: [
        {
          name: "Pedidos",
          data: orderQuantityValues.data,
        },
      ],
    };

    // Product quantity
    const countProductQuantityValues = () => {
      const productCounts = {};

      orders.forEach(({ product }) => {
        product.forEach(({ name }) => {
          if (productCounts[name]) {
            productCounts[name]++;
          } else {
            productCounts[name] = 1;
          }
        });
      });

      const productNames = Object.keys(productCounts);
      const productQuantities = Object.values(productCounts);

      return { data: productQuantities, categories: productNames };
    };

    const productQuantityValues = countProductQuantityValues();

    const productQuantityOptions = {
      options: {
        chart: {
          type: "pie",
          height: 380,
        },
        labels: productQuantityValues.categories,
        responsive: [
          {
            breakpoint: 480,
            options: {
              chart: {
                height: 300,
              },
              legend: {
                position: "bottom",
              },
            },
          },
        ],
      },
      series: productQuantityValues.data,
    };

    setOrderQuantityData(orderQuantityOptions);
    setProductQuantityData(productQuantityOptions);
  }, [orders]);

  if (isLoading || isLoadingOrders) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <AdminHeader />

      <section className="statistics" id="list">
        <h1 className="title">Estatísticas dos Pedidos</h1>
        <div className="charts">
          {orderQuantityData.options && (
            <>
              <div className="charts-card">
                <p className="chart-title">Pedidos mensais</p>
                <div id="bar-chart">
                  <Chart
                    options={orderQuantityData.options}
                    series={orderQuantityData.series}
                    type="bar"
                    height={350}
                  />
                </div>
              </div>
            </>
          )}

          {productQuantityData.options && (
            <>
              <div className="charts-card">
                <p className="chart-title">Vendas por produto</p>
                <div id="pie-chart">
                  <Chart
                    options={productQuantityData.options}
                    series={productQuantityData.series}
                    type="pie"
                    height={350}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
