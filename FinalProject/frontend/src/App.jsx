import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Import Pages
import Join from "./Join";
import Meeting from "./Meeting";
import CameraComponent from "./CameraComponent";

// Router Config
const router = createBrowserRouter([
  {
    path: "/",
    element: <Join />,
  },
  {
    path: "/meeting/:roomid",
    element: <Meeting />,
  },
]);

function App() {
  return (
    <div className="App">
      <h1>Pose Estimation App</h1>
      <CameraComponent />
      {/* <RouterProvider router={router} /> */}
    </div>
  );
}

export default App;
