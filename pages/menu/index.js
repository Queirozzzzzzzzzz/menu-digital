import { useRouter } from "next/router";
import { useEffect } from "react";

import { useUser } from "pages/interface";

export default function Menu() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {}, [user, router, isLoading]);

  return (
    <>
      <h1>Menu</h1>
    </>
  );
}
