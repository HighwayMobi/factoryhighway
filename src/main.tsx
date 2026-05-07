import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const isInApp =
  navigator.userAgent.includes("HighwayApp") ||
  new URLSearchParams(window.location.search).get("app") === "1" ||
  sessionStorage.getItem("in-mobile-app") === "1";

if (isInApp) {
  sessionStorage.setItem("in-mobile-app", "1");
  document.documentElement.classList.add("in-mobile-app");
}

createRoot(document.getElementById("root")!).render(<App />);
