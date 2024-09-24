import { createBrowserRouter } from "react-router-dom";

import { Applayout } from "./components/layouts/AppLayout";

import NoMatch from "./pages/NoMatch";
import Machine from "./pages/machine/machine";
import { ReactFlowProvider } from "@xyflow/react";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Applayout />,
      children: [
        {
          path: "",
          element: (
            <ReactFlowProvider>
              <Machine />
            </ReactFlowProvider>
          ),
        },
      ],
    },
    {
      path: "*",
      element: <NoMatch />,
    },
  ],
  {
    basename: global.basename,
  }
);
