export function FloatingCta() {
  const tel = ["010", "8835", "7775"].join("");
  return (
    <div className="floating-cta" role="region" aria-label="태영목공 CTA 배너">
      <a className="floating-cta-primary" href={`tel:${tel}`} aria-label="태영목공에 전화 상담">
        전화 상담
      </a>
    </div>
  );
}
