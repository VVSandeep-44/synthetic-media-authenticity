type Props = {
  mediaUrl: string;
  mediaKind: 'image' | 'video';
};

export function MediaPreview({ mediaUrl, mediaKind }: Props) {
  return (
    <section style={{ border: '1px solid #d0d7de', borderRadius: 16, padding: '1rem', background: '#fff' }}>
      <h2 style={{ marginTop: 0 }}>Original Media</h2>
      {mediaKind === 'image' ? (
        <img
          src={mediaUrl}
          alt="Uploaded media preview"
          style={{ width: '100%', maxHeight: 420, objectFit: 'contain', borderRadius: 12, background: '#0b1020' }}
        />
      ) : (
        <video
          controls
          src={mediaUrl}
          style={{ width: '100%', maxHeight: 420, borderRadius: 12, background: '#0b1020' }}
        />
      )}
    </section>
  );
}