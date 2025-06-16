import React, { createContext, useContext } from 'react';

const ShipmentsContext = createContext();

export const ShipmentsProvider = ({ children, value }) => {
  return (
    <ShipmentsContext.Provider value={value}>
      {children}
    </ShipmentsContext.Provider>
  );
};

export const useShipments = () => {
  const context = useContext(ShipmentsContext);
  if (!context) {
    throw new Error('useShipments must be used within a ShipmentsProvider');
  }
  return context;
};
