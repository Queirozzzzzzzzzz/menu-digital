import { useRouter } from "next/router";
import { useEffect } from "react";

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
      <h1>Pedidos</h1>
    </>
  );
}
