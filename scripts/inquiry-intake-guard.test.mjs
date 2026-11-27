// 문의 입구 가드 (문의봇 차단 V6, 2026-11-27) — 이 입구는 DB 에 직접 쓰지 않고 어드민 공용 접수 창구로 넘긴다.
// 공개 열쇠로 다시 직접 넣으면 사이트 전용 열쇠·창구 거르기·나중의 DB 막기가 다 무의미해진다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/app/api/inquiry/route.ts", import.meta.url), "utf8");

test("어드민 접수 창구로 사이트 전용 열쇠를 붙여 넘긴다", () => {
  assert.match(src, /\/api\/public\/inquiry/);
  assert.match(src, /SITE_INTAKE_KEY/);
  assert.match(src, /["']?x-site-key["']?\s*:/i);
});
test("DB 에 직접 쓰지 않는다(공개·서비스 열쇠·rest 넣기 없음)", () => {
  assert.doesNotMatch(src, /\/rest\/v1\/inquiries/);
  assert.doesNotMatch(src, /SUPABASE_ANON_KEY|SUPABASE_SERVICE/);
});
