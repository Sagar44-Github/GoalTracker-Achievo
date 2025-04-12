import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App.tsx";
import "./index.css";

// Get the root element and initialize with error handling
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Failed to find the root element");
  document.body.innerHTML =
    '<div style="color: red; padding: 20px;">Failed to initialize the application: Root element not found.</div>';
} else {
  const root = createRoot(rootElement);

  try {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (error) {
    console.error("Failed to render the app:", error);
    root.render(
      <div style={{ color: "red", padding: "20px" }}>
        <h2>Application Error</h2>
        <p>
          The application failed to initialize properly. Please reload the page.
        </p>
        <pre>{error instanceof Error ? error.message : String(error)}</pre>
      </div>
    );
  }
}
