import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const rootElement = document.getElementById("root");
if (!rootElement) {
    console.error("No root element found!");
} else {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
} 
