import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'

const UserStore = (set) => ({
    user: null,
    token: null,

    setUser: (User) => set((state) => ({
        ...state, 
        user: User
    })),

    setToken: (token) => set((state) => ({
        ...state, 
        token: token
    })),

    clearUser: () => set({ user: null, token: null })
});

export const useUser = create(persist(devtools(UserStore), { name: 'userStore' }));