// components/landing/CreateRoomForm.tsx

'use client';

import { ChevronRight, Loader2 } from 'lucide-react';
import { useCreateRoomForm } from '@/hooks/useCreateRoomForm';

export default function CreateRoomForm() {
  const {
    name,
    setName,
    roomName,
    setRoomName,
    duration,
    setDuration,
    isLoading,
    errors,
    serverError,
    handleSubmit,
  } = useCreateRoomForm();

  return (
    <section className="w-full max-w-4xl text-center mb-24">
      <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4">
        Watch Together. <span className="text-yellow-400">Instantly.</span>
      </h2>
      <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-300 mb-8">
        Create a private room, share the link, and enjoy synchronized YouTube or Twitch streams with friends. No accounts, no hassle.
      </p>
      
      {/* Form Card */}
      <div className="mx-auto w-full max-w-lg bg-black/20 backdrop-blur-lg border border-white/20 rounded-xl p-6 sm:p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full">
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg bg-white/10 border ${errors.name ? 'border-red-500' : 'border-white/20'} focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all placeholder-gray-400`}
              />
              {errors.name && <p className="text-red-400 text-sm mt-1 text-left">{errors.name}</p>}
            </div>
            <div className="w-full">
              <input
                type="text"
                placeholder="Room Name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg bg-white/10 border ${errors.room ? 'border-red-500' : 'border-white/20'} focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all placeholder-gray-400`}
              />
              {errors.room && <p className="text-red-400 text-sm mt-1 text-left">{errors.room}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-2 block text-left">Room Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="duration-select w-full px-3 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
            >
              <option value={60}>1 Hour</option>
              <option value={180}>3 Hours</option>
              <option value={360}>6 Hours</option>
              <option value={720}>12 Hours</option>
              <option value={1440}>24 Hours</option>
            </select>
          </div>

          {serverError && <p className="text-red-400 text-sm text-center bg-red-500/20 py-2 rounded-lg">{serverError}</p>}
            
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-yellow-400 text-black font-bold py-3 rounded-lg hover:bg-yellow-300 transition-all text-lg shadow-lg hover:shadow-yellow-400/50 flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Create Your Room'}
            {!isLoading && <ChevronRight className="w-5 h-5 ml-2" />}
          </button>
        </form>
      </div>
    </section>
  );
}