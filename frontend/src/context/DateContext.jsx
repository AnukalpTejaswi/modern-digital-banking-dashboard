import { createContext, useContext, useState } from "react";

const DateContext = createContext();

export function DateProvider({ children }) {
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );

  return (
    <DateContext.Provider
      value={{
        selectedMonth,
        setSelectedMonth,
        selectedYear,
        setSelectedYear,
      }}
    >
      {children}
    </DateContext.Provider>
  );
}

export function useDate() {
  const ctx = useContext(DateContext);
  if (!ctx) {
    throw new Error("useDate must be used inside DateProvider");
  }
  return ctx;
}
