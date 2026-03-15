'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-6">📵</div>
      <h1 className="text-2xl font-bold text-[#2C1A14] mb-2">Немає з'єднання</h1>
      <p className="text-sm text-[#6B5750] max-w-xs">
        Перевір підключення до інтернету і спробуй ще раз.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-8 px-6 py-3 bg-[#789A99] text-white rounded-2xl text-sm font-semibold"
      >
        Спробувати знову
      </button>
    </div>
  );
}
