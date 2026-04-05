export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50">
      <main className="flex flex-1 w-full max-w-7xl flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Recipe Sharing App
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Share and discover delicious recipes with the community
          </p>
          <div className="mt-8 max-w-md mx-auto bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Phase 2: In Progress</h2>
            <p className="text-sm text-gray-600">
              Custom hooks and utilities have been migrated. Next steps: Copy TipTap editor and complete Phase 2.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
