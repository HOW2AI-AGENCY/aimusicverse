import React, { createContext, useContext, useMemo, useState } from "react";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState("dark");
  const value = useMemo(
    () => ({
      theme,
      resolvedTheme: "dark",
      setTheme,
      toggleTheme: () => setTheme((t: string) => (t === "dark" ? "light" : "dark")),
    }),
    [theme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  return useContext(ThemeContext) ?? { theme: "dark", resolvedTheme: "dark", setTheme() {}, toggleTheme() {} };
};