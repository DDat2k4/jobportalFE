import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../components/login";
import AddJob from "../pages/add-job";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/add-job", element: <AddJob /> },
  { path: "*", element: <Home /> },
]);

export default router;
