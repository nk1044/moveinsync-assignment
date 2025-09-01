import React, { useState, useCallback, useEffect } from 'react';
import { useUser } from '../Store/zustand.js';
import { GetCurrentUser } from '../Server/Server.js';
import { useNavigate, useLocation } from 'react-router-dom';
import Loading from './Loading.jsx';

function Auth({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [loader, setLoader] = useState(true);
    const user = useUser(useCallback(state => state.user, []));
    const setUser = useUser(useCallback(state => state.setUser, []));

    const checkUser = async () => {
        try {
            const CurrentUser = await GetCurrentUser();
            console.log("Current User in Auth.jsx: ", CurrentUser);
            
            if (!CurrentUser || String(CurrentUser?.email).trim() !== String(user?.email).trim()) {
                setUser(null);
                console.log("User not found in database in Auth.jsx");
                navigate("/login-user");
            }

            return CurrentUser || null;
        } catch (error) {
            console.log("Failed to get current user in Auth.jsx: ", error);
            setUser(null);
            navigate("/login-user");
            return null;
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoader(true);
            const CurrentUser = await checkUser();
            if (!CurrentUser) {
                setUser(null);
                console.log("User not found in Auth.jsx");
                navigate("/login-user");
            }
            if(user.role=='user'){
                if (location.pathname === "/queue-page") {
                    navigate("/add-to-queue");
                }
            }

            setLoader(false);
        };

        fetchData();
    }, [location.pathname, setUser]);

    return loader ? <Loading/>: <>{children}</>;
}

export default Auth;