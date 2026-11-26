// Chhota label + bari heading + ek line ki wazahat
export default function SectionHeading({
  eyebrow,
  title,
  text,
  align = "left",
  invert = false,
  as: Tag = "h2",
  className = "",
}) {
  const alignment = align === "center" ? "mx-auto text-center" : "";
  return (
    <div className={`max-w-2xl ${alignment} ${className}`}>
      {eyebrow && (
        <p className={`type-eyebrow ${invert ? "text-primary" : "text-accent"}`}>{eyebrow}</p>
      )}
      <Tag className={`type-h2 ${eyebrow ? "mt-3" : ""} ${invert ? "text-white" : "text-ink"}`}>
        {title}
      </Tag>
      {text && (
        <p className={`type-body mt-4 ${invert ? "text-white/70" : "text-muted"}`}>{text}</p>
      )}
    </div>
  );
}