import { MessageCircle } from "lucide-react";
import { FacebookIcon, InstagramIcon, XIcon, YouTubeIcon } from "./SocialIcons";
import { hotelInfo } from "../../lib/hotelInfo";

const variants = {
  bar: {
    link: "inline-flex size-6 items-center justify-center text-white/70 transition-colors hover:text-white",
    icon: "size-4",
  },
  boxed: {
    link: "inline-flex size-10 items-center justify-center rounded-lg border border-white/20 text-white transition-colors hover:bg-white/10",
    icon: "size-5",
  },
  outline: {
    link: "inline-flex size-11 items-center justify-center rounded-lg border border-line text-ink transition-colors hover:bg-soft",
    icon: "size-5",
  },
};

export default function SocialLinks({ variant = "bar", className = "" }) {
  const { social, whatsapp } = hotelInfo;
  const style = variants[variant];

  const links = [
    social.facebook && { label: "Facebook", href: social.facebook, Icon: FacebookIcon },
    social.instagram && { label: "Instagram", href: social.instagram, Icon: InstagramIcon },
    social.x && { label: "X", href: social.x, Icon: XIcon },
    social.youtube && { label: "YouTube", href: social.youtube, Icon: YouTubeIcon },
    whatsapp && { label: "WhatsApp", href: `https://wa.me/${whatsapp}`, Icon: MessageCircle },
  ].filter(Boolean);

  if (links.length === 0) return null;

  return (
    <ul className={`flex items-center gap-2 ${className}`}>
      {links.map(({ label, href, Icon }) => (
        <li key={label}>
          <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={style.link}>
            <Icon className={style.icon} />
          </a>
        </li>
      ))}
    </ul>
  );
}