'use client' // Add this line
import { createContext, useContext, useState, useEffect } from 'react'
// User context to hold user info
const UserContext = createContext()
import axios from 'axios'
export function UserProvider({ children }) {
  const [user, setUser] = useState(null)

  const login = async (identifier, password) => {
    // const response = await fetch('/api/auth/login', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ identifier, password }),
    // });
    // const data = await response.json();
    // if (response.ok) {
    //     setUser({
    //         id: data.id, // Ensure the server returns this
    //         username: data.username,
    //         email: data.email,
    //         role: data.role,
    //     });
    // } else {
    //     throw new Error(data.error);
    // }
  }

  const logout = async () => {
    // await fetch('/api/auth/logout', { method: 'POST' });
    // setUser(null);
  }

  // Load user data on initial mount
  useEffect(() => {
    // const loadUserData = async () => {
    //     try {
    //         const response = await axios.get('/api/auth/me');
    //         if (response.status === 200) {
    //             setUser(response.data.data); // Assuming data structure matches
    //         } else {
    //             console.error('Failed to load user data:', response.statusText);
    //         }
    //     } catch (error) {
    //         console.error('Error loading user data:', error);
    //     }
    // };
    // loadUserData();
  }, [])

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  )
}

// Custom hook to use user context
export const useUser = () => useContext(UserContext)
