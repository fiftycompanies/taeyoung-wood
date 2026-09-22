"use client";

import { useEffect } from "react";
import { captureUtm } from "@/lib/utm";

/** 첫 진입 페이지에서 UTM·최초 외부 referrer 를 저장한다. 레이아웃은 이동해도 다시 안 붙으므로 = 랜딩 페이지 1회. */
export function AttributionCapture() {
  useEffect(() => {
    captureUtm();
  }, []);
  return null;
}
