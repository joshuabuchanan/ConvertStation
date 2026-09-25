export default function FileCard({ title, description }: { title: string; description: string }) {
  return <div className="mini-card"><strong>{title}</strong><span>{description}</span></div>;
}
