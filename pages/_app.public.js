import { UserProvider } from "pages/interface";
import Header from "components/header";
import "components/css/index.css";

export default function MyApp({ Component, pageProps }) {
  return (
    <UserProvider>
      <Header />
      <Component {...pageProps} />
    </UserProvider>
  );
}
