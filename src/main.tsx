import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Detect mobile app wrapper (HighwayApp UA or ?app=1) and hide footer
if (
  navigator.userAgent.includes("HighwayApp") ||
  new URLSearchParams(window.location.search).get("app") === "1"
) {
  document.documentElement.classList.add("in-mobile-app");
}

createRoot(document.getElementById("root")!).render(<App />);
