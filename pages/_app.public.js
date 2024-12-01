import { Toaster } from "sonner";

import { UserProvider } from "pages/interface";
import "components/css/index.css";

export default function MyApp({ Component, pageProps }) {
  return (
    <UserProvider>
      <Toaster />
      <Component {...pageProps} />
    </UserProvider>
  );
}
