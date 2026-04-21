import React, { createContext, useContext, useState } from "react";

const ModeContext = createContext(null);

export function ModeProvider({ children }) {
  const [mode, setModeState] = useState(
    localStorage.getItem("simutrade_mode") || "demo"
  );

  const setMode = (newMode) => {
    setModeState(newMode);
    localStorage.setItem("simutrade_mode", newMode);
  };

  return (
    <ModeContext.Provider
      value={{
        mode,
        setMode,
        isDemo: mode === "demo",
        isLive: mode === "real",
      }}
    >
      {children}
    </ModeContext.Provider>
  );
}

export const useMode = () => useContext(ModeContext);
