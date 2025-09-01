import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Layout from './pages/Layout';
import Home from './pages/Home';
import Login from './pages/Login';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: '', element: <Home /> },
      { path: 'auth', element: <Login /> },
    ]
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App
