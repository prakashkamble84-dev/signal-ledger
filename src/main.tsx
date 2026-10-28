import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

createRoot(document.getElementById("root")!).render(<AuthProvider><App /></AuthProvider>);
