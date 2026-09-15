// Placeholder. The real Explore page is spec 04, and the app shell around it
// is spec 03. This exists so the route tree builds after setup.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Video Arena</h1>
      <p className="max-w-md text-sm text-zinc-500">
        Project setup is done. Explore, the create tools and the library get
        built in the following specs.
      </p>
    </main>
  );
}
