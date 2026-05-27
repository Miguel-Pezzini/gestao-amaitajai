import { ToastProvider } from "@/contexts/toast-context";
import { AppRoutes } from "@/routes/AppRoutes";

function App() {
  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  );
}

export default App;
