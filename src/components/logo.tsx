import { appConfig } from "@/config/app";

export function Logo() {
  return <span className="font-bold">{appConfig.name}</span>;
}
