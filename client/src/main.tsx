import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

window.addEventListener("unhandledrejection", (event) => {
  if (event.reason && !(event.reason instanceof Error)) {
    console.warn("Non-Error rejection caught:", typeof event.reason, event.reason);
    event.preventDefault();
  }
});

window.addEventListener("error", (event) => {
  if (event.error && !(event.error instanceof Error)) {
    console.warn("Non-Error exception caught:", typeof event.error, event.error);
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
