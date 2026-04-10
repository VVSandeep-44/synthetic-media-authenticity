type Props = {
  title: string;
  imageSrc: string;
  description?: string;
};

export function HeatmapViewer({ title, imageSrc, description }: Props) {
  return (
    <section style={{ border: '1px solid #d0d7de', borderRadius: 16, padding: '1rem', background: '#fff' }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <img
        src={imageSrc}
        alt={title}
        style={{ width: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 12, background: '#0b1020' }}
      />
      {description ? <p style={{ marginBottom: 0 }}>{description}</p> : null}
    </section>
  );
}
