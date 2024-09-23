import { Outlet } from "react-router-dom";
import { Header } from "./Header";

export function Applayout() {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <Outlet />
    </div>
  );
}
