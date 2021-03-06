import React, { useCallback, useEffect, useState } from 'react';
import {ConsoleServices} from "@services/ConsoleServices";

const initialContext = {
  error: '',
  loading: true,
  cm: (undefined as unknown) as CacheManager,
  caches: [] as CacheInfo[],
  loadingCaches: true,
  errorCaches: '',
  reloadCaches: () => {},
};

export const DataContainerContext = React.createContext(initialContext);

const ContainerDataProvider = ({ children }) => {
  const [cm, setCm] = useState<CacheManager>(initialContext.cm);
  const [caches, setCaches] = useState<CacheInfo[]>(initialContext.caches);
  const [error, setError] = useState(initialContext.error);
  const [loading, setLoading] = useState(initialContext.loading);
  const [errorCaches, setErrorCaches] = useState(initialContext.errorCaches);
  const [loadingCaches, setLoadingCaches] = useState(
    initialContext.loadingCaches
  );

  useEffect(() => {
    if (loading) {
      ConsoleServices.dataContainer()
        .getDefaultCacheManager()
        .then((eitherCm) => {
          if (eitherCm.isRight()) {
            setCm(eitherCm.value);
          } else {
            setError(eitherCm.value.message);
          }
        })
        .then(() => setLoading(false));
    }
  }, [loading]);

  useEffect(() => {
    if (loadingCaches && cm) {
      ConsoleServices.dataContainer()
        .getCaches(cm.name)
        .then((either) => {
          if (either.isRight()) {
            setCaches(either.value);
          } else {
            setErrorCaches(either.value.message);
          }
        })
        .then(() => setLoadingCaches(false));
    }
  }, [cm, loadingCaches]);

  const reloadCaches = () => {
    setLoadingCaches(true);
  };

  const contextValue = {
    loading: loading,
    error: error,
    caches: caches,
    cm: cm,
    loadingCaches: loadingCaches,
    errorCaches: errorCaches,
    reloadCaches: useCallback(reloadCaches, []),
  };

  return (
    <DataContainerContext.Provider value={contextValue}>
      {children}
    </DataContainerContext.Provider>
  );
};

export { ContainerDataProvider };
