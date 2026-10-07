import test from 'node:test';
import assert from 'node:assert/strict';
import { blogMetadata } from '../src/lib/blog-metadata.ts';

const siteUrl = 'https://taeyoung-interior.revrun.kr';
test('발행 글은 자기 주소와 자기 제목·사진을 공유한다', () => {
  const m = blogMetadata({slug:'몰딩-시공',title:'몰딩 시공 마감선',excerpt:'실제 시공 안내',image:'https://example.com/work.webp'}, siteUrl);
  assert.equal(m.alternates.canonical, siteUrl+'/blog/'+encodeURIComponent('몰딩-시공'));
  assert.equal(m.openGraph.url, m.alternates.canonical);
  assert.equal(m.title, '몰딩 시공 마감선');
  assert.equal(m.openGraph.title, '몰딩 시공 마감선 | 태영목공');
  assert.equal(m.openGraph.images[0].url, 'https://example.com/work.webp');
});
test('정적 글도 개별 주소를 유지하고 기본 사진을 사용한다', () => {
  const m = blogMetadata({slug:'hidden-door-detail',title:'히든도어 안내',excerpt:'문틀 점검'}, siteUrl);
  assert.equal(m.alternates.canonical, siteUrl+'/blog/hidden-door-detail');
  assert.equal(m.openGraph.url, m.alternates.canonical);
  assert.equal(m.openGraph.description, '문틀 점검');
  assert.equal(m.openGraph.images[0].url, '/images/hero.jpg');
});
