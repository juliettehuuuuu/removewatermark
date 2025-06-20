"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    // 确保只在需要时添加 antialiased，并且不移除其他类
    if (!document.body.classList.contains("antialiased")) {
      document.body.classList.add("antialiased");
    }
  }, []);

  return <>{children}</>;
}
