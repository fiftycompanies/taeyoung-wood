export function FloatingCta() {
  const tel = ["050", "7458", "4929"].join("");
  return (
    <div className="floating-cta" role="region" aria-label="태영목공 CTA 배너">
      <a className="floating-cta-primary" href={`tel:${tel}`} aria-label="태영목공에 전화 상담">
        전화 상담
      </a>
    </div>
  );
}
