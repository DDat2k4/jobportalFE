import { initAuthInterceptors } from "./auth/auth";
import AppRouter from "./router/AppRouter";

initAuthInterceptors();

function App() {
  return <AppRouter />;
}

export default App;
