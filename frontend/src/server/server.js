import axios from 'axios';

const backend_url = String(import.meta.env.VITE_BACKEND_URI);

const LoginUser = async (data) => {
  try {
    const response = await axios.post(
      `${backend_url}/api/users/login-user`, 
      { ...data }, 
      { withCredentials: true }
    );
    console.log(response.data);
    return response.data;
  } catch (err) {
    console.log('LoginUser failed', err);
    return { status: 400, error: err?.response?.data?.message };
  }
};

const RegisterUser = async (data) => {
  try {
    const response = await axios.post(
      `${backend_url}/api/users/register-user`, 
      { ...data }, 
      { withCredentials: true }
    );
    return response.data;
  } catch (err) {
    console.log('RegisterUser failed', err);
    throw err;
  }
};

const LogOut = async () => {
  try {
    const data = await axios.get(
      `${backend_url}/api/users/logout-user`, 
      { withCredentials: true }
    );
    
    return data;
  } catch (err) {
    console.log('Logout failed', err);
    throw err;
  }
};

const GetCurrentUser = async () => {
  try {
    const response = await axios.get(
      `${backend_url}/api/users/get-current-user`, 
      { withCredentials: true }
    );
    
    return response?.data?.user;
  } catch (error) {
    console.log('GetCurrentUser failed', error?.response?.data?.message);
    return null;
  }
};

export {
    LoginUser,
    RegisterUser,
    LogOut,
    GetCurrentUser,
}