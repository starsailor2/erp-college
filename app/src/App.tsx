import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ThemeProvider from "@/providers/ThemeProvider";
import { router } from "@/router";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </AuthProvider>
  );
}
