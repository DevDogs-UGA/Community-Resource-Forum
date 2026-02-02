import { useCallback, useEffect, type DependencyList } from "react";

export default function useDocumentEvent<K extends keyof DocumentEventMap>(
  type: K,
  callback: (ev: DocumentEventMap[K]) => void,
  deps: DependencyList,
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handler = useCallback(callback, deps);

  useEffect(() => {
    const controller = new AbortController();
    document.addEventListener(type, handler, controller);
    return () => controller.abort();
  }, [handler, type]);
}
