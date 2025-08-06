import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/App.css"; // App.cssを最優先で読み込み
import "./styles/index.css";
import App from "./components/App";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
