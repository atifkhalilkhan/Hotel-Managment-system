// Har section ka andar ka dabba: max 1200px, bachon wale margins
export default function Container({ as: Tag = "div", className = "", children, ...props }) {
  return (
    <Tag className={`mx-auto w-full max-w-[1200px] px-5 sm:px-8 ${className}`} {...props}>
      {children}
    </Tag>
  );
}