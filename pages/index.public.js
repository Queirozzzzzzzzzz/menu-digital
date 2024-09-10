import { useRouter } from "next/router";
import { useEffect } from "react";

import { useUser } from "pages/interface";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (router && !user && !isLoading) {
      router.push(`/menu`);
    }

    if (router && user && !isLoading) {
      router.push(`/admin/orders`);
    }
  }, [user, router, isLoading]);

  return (
    <>
      <h1>Redirecionando...</h1>
    </>
  );
}
