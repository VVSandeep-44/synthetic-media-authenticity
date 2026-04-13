type Props = {
  title: string;
  imageSrc: string;
  description?: string;
};

export function HeatmapViewer({ title, imageSrc, description }: Props) {
  return (
    <section className="surface-card result-panel">
      <div className="card-hud">
        <span className="card-status">LIVE</span>
        <span className="caption-chip signal">SIGNAL</span>
      </div>
      <h2 className="card-title">{title}</h2>
      <img src={imageSrc} alt={title} className="media-frame" />
      {description ? <p className="card-body">{description}</p> : null}
      <div className="signal-wave" aria-hidden="true" />
    </section>
  );
}
