type Props = {
  mediaUrl: string;
  mediaKind: 'image' | 'video';
};

export function MediaPreview({ mediaUrl, mediaKind }: Props) {
  return (
    <section className="surface-card result-panel">
      <div className="card-hud">
        <span className="card-status">SIGNAL</span>
        <span className="caption-chip live">SOURCE LIVE</span>
      </div>
      <h2 className="card-title">Original Media</h2>
      {mediaKind === 'image' ? (
        <img src={mediaUrl} alt="Uploaded media preview" className="media-frame" />
      ) : (
        <video controls src={mediaUrl} className="media-frame" />
      )}
      <div className="signal-wave" aria-hidden="true" />
    </section>
  );
}