export function BlobBackground() {
  return (
    <div className="blob-container" aria-hidden="true">
      {/* Warm peach blob — top right */}
      <div
        className="blob"
        style={{
          width: '700px',
          height: '700px',
          top: '-250px',
          right: '-200px',
          background: 'rgba(255, 210, 190, 0.38)',
          animationDelay: '0s',
          animationDuration: '24s',
        }}
      />
      {/* Sage/teal blob — bottom left */}
      <div
        className="blob"
        style={{
          width: '550px',
          height: '550px',
          bottom: '-150px',
          left: '-180px',
          background: 'rgba(120, 154, 153, 0.22)',
          animationDelay: '-8s',
          animationDuration: '20s',
        }}
      />
      {/* Cream blob — center */}
      <div
        className="blob"
        style={{
          width: '450px',
          height: '450px',
          top: '40%',
          left: '35%',
          background: 'rgba(255, 242, 235, 0.55)',
          animationDelay: '-16s',
          animationDuration: '26s',
        }}
      />
      {/* Small sage — top left */}
      <div
        className="blob"
        style={{
          width: '300px',
          height: '300px',
          top: '10%',
          left: '5%',
          background: 'rgba(143, 181, 180, 0.18)',
          animationDelay: '-12s',
          animationDuration: '18s',
        }}
      />
    </div>
  );
}
