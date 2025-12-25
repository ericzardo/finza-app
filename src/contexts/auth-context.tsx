"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { loginRequest, registerRequest, logoutRequest, getMeRequest } from "@/http/auth";
import { LoginData, RegisterData } from "@/schemas/auth";

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>; 
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getMeRequest();
        
        if (userData) {
          setUser(userData);
        } else {
          setUser(null);
          logoutRequest(); 
        }
      } catch (error) {
        console.error("Erro crítico de sessão:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (data: LoginData) => {
    try {
      const userResponse = await loginRequest(data);
      setUser(userResponse);
      router.push("/dashboard");
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const userResponse = await registerRequest(data);
      setUser(userResponse);
      router.push("/dashboard");
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutRequest(); 
    } catch (error) {
      console.error("Erro no logout API", error);
    } finally {
      setUser(null);
      router.push("/login"); 
      router.refresh(); 
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user,
        isLoading,
        login, 
        register, 
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);