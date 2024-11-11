import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { useUser } from "pages/interface";
import AdminHeader from "components/adminHeader";

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
      <AdminHeader />

      <section className="orders" id="orders">
        <p>eae</p>
      </section>
    </>
  );
}
