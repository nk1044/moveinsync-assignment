import React, { useState, useCallback, useEffect } from 'react';
import { useUser } from '../store/zustand.js';
import { GetCurrentUser } from '../server/auth.js';
import { useNavigate } from 'react-router-dom';
import Loading from './Loading.jsx';

function Auth({ children }) {
    const navigate = useNavigate();
    const [loader, setLoader] = useState(true);
    const user = useUser(useCallback(state => state.user, []));
    const setUser = useUser(useCallback(state => state.setUser, []));

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const currentUser = await GetCurrentUser();
                
                if (!currentUser) {
                    setUser(null);
                    navigate("/auth");
                } else {
                    if (String(user?.email).trim() !== String(currentUser?.email).trim()) {
                         setUser(currentUser);
                    }
                    setLoader(false);
                }
            } catch (error) {
                console.log("Failed to get current user in Auth.jsx: ", error);
                setUser(null);
                navigate("/auth");
            }
        };

        checkAuthStatus();
    }, [navigate, setUser, user]);

    return loader ? <Loading/> : <>{children}</>;
}

export default Auth;
