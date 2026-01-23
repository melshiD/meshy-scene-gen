export default function Home(): React.ReactElement {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">3D Scene Generator</h1>
      <p className="text-gray-400 mb-8">
        Generate composed 3D scene images from text prompts
      </p>
      <div className="flex gap-4">
        <a
          href="/composer"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Scene Composer
        </a>
        <a
          href="/api/generate"
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          API Docs
        </a>
      </div>
    </main>
  );
}
