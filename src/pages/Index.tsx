import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import Dashboard from "./Dashboard";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-pulse-glow rounded-full bg-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Dashboard />;
};

export default Index;
