type Props = {
  mediaUrl: string;
  mediaKind: 'image' | 'video';
};

export function MediaPreview({ mediaUrl, mediaKind }: Props) {
  return (
    <section className="surface-card">
      <h2 className="card-title">Original Media</h2>
      {mediaKind === 'image' ? (
        <img src={mediaUrl} alt="Uploaded media preview" className="media-frame" />
      ) : (
        <video controls src={mediaUrl} className="media-frame" />
      )}
    </section>
  );
}