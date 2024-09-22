import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Applayout() {
    return (
      <>
        <Header />
        <Outlet />
        <div className="container px-4 md:px-8">
          <Footer />
        </div>
      </>
    );
}
