import { useAuth } from "../context/AuthContext";

const PublicRoute = ({ children }) => {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
            </div>
        );
    }

    return children;
};

export default PublicRoute;