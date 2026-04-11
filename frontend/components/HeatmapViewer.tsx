type Props = {
  title: string;
  imageSrc: string;
  description?: string;
};

export function HeatmapViewer({ title, imageSrc, description }: Props) {
  return (
    <section className="surface-card">
      <h2 className="card-title">{title}</h2>
      <img src={imageSrc} alt={title} className="media-frame" />
      {description ? <p className="card-body">{description}</p> : null}
    </section>
  );
}
