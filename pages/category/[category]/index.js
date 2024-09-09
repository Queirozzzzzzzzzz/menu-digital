import { useRouter } from "next/router";
import { useEffect } from "react";

import { useUser } from "pages/interface";

export default function Category() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {}, [user, router, isLoading]);

  return (
    <>
      <h1>{router.query.category}</h1>
    </>
  );
}
