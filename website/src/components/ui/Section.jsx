import Container from "./Container";

const tones = {
  white: "bg-white text-ink",
  soft: "bg-soft text-ink",
  dark: "bg-ink text-white",
};

// Ek page ka hissa: rang (tone) aur upar neeche ka faasla yahin tay hota hai
export default function Section({
  tone = "white",
  spacing = "py-16 md:py-24 lg:py-32",
  className = "",
  children,
  ...props
}) {
  return (
    <section className={`${tones[tone]} ${spacing} ${className}`} {...props}>
      <Container>{children}</Container>
    </section>
  );
}