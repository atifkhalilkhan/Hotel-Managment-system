import { useParams } from "react-router-dom";
import Section from "../components/ui/Section";

export default function Placeholder({ eyebrow, title, text, tall = false, anchors = [] }) {
  const { type } = useParams();
  const heading = type ? type.charAt(0).toUpperCase() + type.slice(1) : title;

  return (
    <>
      <Section>
        <p className="type-eyebrow text-accent">{eyebrow}</p>
        <h1 className="type-display mt-4 max-w-3xl">{heading}</h1>
        {text && <p className="type-body mt-5 max-w-xl text-muted">{text}</p>}
      </Section>

      {anchors.map(({ id, title: anchorTitle }) => (
        <Section key={id} id={id} tone="soft" className="min-h-[60vh]">
          <h2 className="type-h2">{anchorTitle}</h2>
          <p className="type-body mt-3 text-muted">Details coming soon.</p>
        </Section>
      ))}

      {tall && (
        <>
          <Section tone="soft" className="min-h-[70vh]">
            <h2 className="type-h2">Soft section</h2>
          </Section>
          <Section tone="dark" className="min-h-[70vh]">
            <h2 className="type-h2">Dark section</h2>
          </Section>
          <Section className="min-h-[70vh]">
            <h2 className="type-h2">White section</h2>
          </Section>
        </>
      )}
    </>
  );
}