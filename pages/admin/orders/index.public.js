import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { useUser } from "pages/interface";

export default function Orders() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (router && !user && !isLoading) {
      router.push(`/login`);
    }
  }, [user, router, isLoading]);

  return (
    <>
      <header className="user-header">
        <div className="home-icon">
          <a href="/admin/orders" rel="noopener noreferrer">
            <p>PEDIDOS</p>
          </a>
        </div>

        <div className="home-icon">
          <a href="/admin/products/create" rel="noopener noreferrer">
            <p>PRODUTOS</p>
          </a>
        </div>

        <div className="home-icon">
          <a href="/admin/statistics" rel="noopener noreferrer">
            <p>ESTATÍSTICAS</p>
          </a>
        </div>
      </header>

      <section className="orders" id="orders">
        <p>eae</p>
      </section>
    </>
  );
}
