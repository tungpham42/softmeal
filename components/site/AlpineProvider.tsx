"use client";

import { useEffect } from "react";

export default function AlpineProvider() {
  useEffect(() => {
    let disposed = false;
    void import("alpinejs").then(({ default: Alpine }) => {
      if (disposed) return;
      Alpine.start();
    });
    return () => {
      disposed = true;
    };
  }, []);

  return null;
}
