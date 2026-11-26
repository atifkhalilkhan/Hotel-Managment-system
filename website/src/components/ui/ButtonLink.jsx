import { Link } from "react-router-dom";
import { buttonClasses } from "./buttonStyles";
import { isExternal } from "../../lib/links";

// Website ke andar ka link ho to <Link>, bahar ka (portal, tel, mailto) ho to <a>
export default function ButtonLink({ to, variant, size, className, children, ...props }) {
  const classes = buttonClasses({ variant, size, className });

  if (isExternal(to)) {
    return (
      <a href={to} className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={classes} {...props}>
      {children}
    </Link>
  );
}