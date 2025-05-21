import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Ensure the root and App take full screen
const rootStyle = document.createElement("style");
rootStyle.innerHTML = `
  html, body, #root {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
`;
document.head.appendChild(rootStyle);

createRoot(document.getElementById("root")!).render(<App />);
