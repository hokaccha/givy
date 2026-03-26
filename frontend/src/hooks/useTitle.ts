import { useEffect } from "react";

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Givy` : "Givy";
    return () => {
      document.title = "Givy";
    };
  }, [title]);
}
