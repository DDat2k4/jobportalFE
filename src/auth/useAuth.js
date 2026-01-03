import { useState, useEffect } from "react";
import { getUserFromToken } from "../utils/jwt";
import { isLoggedIn } from "../auth/auth";  

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const currentUser = getUserFromToken(); 
    setUser(currentUser);
    setIsAuthenticated(isLoggedIn());
  }, []);

  return { user, isAuthenticated };
};
