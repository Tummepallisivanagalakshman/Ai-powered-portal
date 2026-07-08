import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Check for our custom JWT token (set by the FastAPI backend login)
    const token = typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;
    if (!token) {
      throw redirect({ to: "/auth" });
    }
    return { token };
  },
  component: () => <Outlet />,
});
