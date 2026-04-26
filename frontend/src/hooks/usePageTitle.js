import { useEffect } from "react";

import { useAuthStore } from "../store/authStore";

const APP_NAME = "Ha-Meem Attendance";

export const usePageTitle = (pageTitle) => {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const namePart = user?.name ? ` - ${user.name}` : "";
    const rolePart = user?.role ? ` (${user.role})` : "";

    document.title = `${pageTitle}${namePart}${rolePart} | ${APP_NAME}`;
  }, [pageTitle, user?.name, user?.role]);
};
