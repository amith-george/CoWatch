// app/page.tsx

import React from 'react';
import Image from 'next/image';
import { Quote, Film, MessageSquare, ScreenShare, Youtube, Twitch, Users } from "lucide-react";

// Import the new Client Component for the form
import CreateRoomForm from '@/components/CreateRoomForm';

// A simple component for feature cards to keep the main component clean
// This is a stateless component, so it's fine to keep it here.
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center transform hover:-translate-y-1 transition-transform duration-300">
    <div className="mx-auto bg-yellow-400/10 text-yellow-400 w-16 h-16 rounded-full flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

// Define constant data directly in the server component file
const FEATURES_DATA = [
    { icon: <Film size={28} />, title: "Synced Playback", description: "Perfectly synchronized video for everyone. Pause, play, and seek together." },
    { icon: <MessageSquare size={28} />, title: "Live Chat", description: "Real-time text chat to share your reactions and talk with your friends." },
    { icon: <ScreenShare size={28} />, title: "Screen Sharing", description: "Share a browser tab, an application, or your entire screen for collaboration." },
    { icon: <Youtube size={28} />, title: "YouTube Support", description: "Watch any public YouTube video or livestream by simply pasting the URL." },
    { icon: <Twitch size={28} />, title: "Twitch Streams", description: "Co-watch your favorite Twitch streamers live with your community." },
    { icon: <Users size={28} />, title: "No Sign-Up", description: "Jump straight into the action. No registration required to create or join rooms." },
];

const HOW_IT_WORKS_STEPS = [
    { number: 1, title: "Create a Room", description: "Fill out the form above to get started." },
    { number: 2, title: "Share the Link", description: "Invite your friends with a unique room URL." },
    { number: 3, title: "Watch Together", description: "Enjoy synced playback and live chat." },
];

const TESTIMONIALS_DATA = [
    { review: "Flawless sync and a refreshingly minimal interface. CoWatch is now essential for our remote team's movie nights.", name: "Sarah L.", company: "Netflix" },
    { review: "The no-signup feature is a game-changer. It's fast, reliable, and respects user privacy—perfect for our community.", name: "Daniel K.", company: "Twitch" },
    { review: "CoWatch strikes the perfect balance between simplicity and power. Our content team uses it for review sessions daily.", name: "Priya M.", company: "YouTube" },
    { review: "We needed a quick way to test synced video for a project. CoWatch was a lifesaver. No clutter, just results.", name: "Leo D.", company: "Discord" },
];

// This is now a SERVER COMPONENT because 'use client' is removed.
export default function Home() {
  return (
    <div className="min-h-screen w-full font-sans text-white bg-black">
      {/* Background Animation */}
      <div className="fixed inset-0 z-0 opacity-50">
        <div className="bg-animation">
          <div id="stars"></div>
          <div id="stars2"></div>
          <div id="stars3"></div>
        </div>
      </div>
      
      <style>{`
        .bg-animation { position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; display: block; }
        #stars, #stars2, #stars3 { position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; display: block; background: transparent; z-index: 0; }
        #stars { background-image: url('https://www.transparenttextures.com/patterns/stardust.png'); animation: move-twink-back 200s linear infinite; }
        #stars2 { background-image: url('https://www.transparenttextures.com/patterns/stardust.png'); animation: move-twink-back 150s linear infinite; }
        #stars3 { background-image: url('https://www.transparenttextures.com/patterns/stardust.png'); animation: move-twink-back 100s linear infinite; }
        @keyframes move-twink-back { from {background-position:0 0;} to {background-position:-10000px 5000px;} }
        .duration-select option { background: #1f2937; color: white; }
      `}</style>

      <div className="relative z-10 flex flex-col items-center px-4 sm:px-8 py-6">
        {/* Header */}
        <header className="flex items-center justify-between w-full max-w-7xl mb-16 sm:mb-24">
          <div className="flex items-center space-x-3">
            <Image src="/logo.png" alt="CoWatch Logo" width="50" height="50" className="drop-shadow-lg" />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter">
              <span className="text-white">Co</span>
              <span className="text-yellow-400" style={{textShadow: '0 0 8px #FBBF24'}}>Watch</span>
            </h1>
          </div>
          <a
            href="https://github.com/amith-george/CoWatch"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-yellow-400 text-black px-5 py-2 rounded-lg text-base font-semibold hover:bg-yellow-300 transition-colors shadow-lg hover:shadow-yellow-400/40 hidden md:block"
          >
            Support Us!
          </a>
        </header>

        {/* Hero Section is now the imported Client Component */}
        <CreateRoomForm />

        {/* Features Section */}
        <section className="w-full max-w-7xl text-center mb-24">
            <h2 className="text-3xl font-bold mb-12">Everything You Need for a Watch Party</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {FEATURES_DATA.map((feature, index) => (
                    <FeatureCard key={index} {...feature} />
                ))}
            </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full max-w-5xl mb-24">
            <h2 className="text-3xl font-bold text-center mb-16">Get Started in Seconds</h2>
            <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-0">
                {HOW_IT_WORKS_STEPS.map((step, index) => (
                    <React.Fragment key={step.number}>
                        <div className="flex flex-col items-center text-center w-full md:w-1/3">
                            <div className="bg-yellow-400 text-black font-bold w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg mb-4">{step.number}</div>
                            <p className="text-lg font-medium">{step.title}</p>
                            <p className="text-sm text-gray-400">{step.description}</p>
                        </div>
                        {index < HOW_IT_WORKS_STEPS.length - 1 && (
                            <div className="flex-1 h-1 w-full md:w-auto md:h-auto bg-white/20 rounded-full md:bg-transparent md:border-t-4 md:border-dashed border-white/20 mx-4"></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </section>

        {/* Testimonials Section */}
        <section className="w-full max-w-7xl mb-24">
          <h2 className="text-3xl font-bold text-center mb-12">Loved by Teams and Communities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TESTIMONIALS_DATA.map((item, index) => (
              <div key={index} className="bg-black/20 border border-white/10 rounded-xl p-6 flex flex-col h-full shadow-lg">
                <Quote className="text-yellow-400 w-8 h-8 mb-4 opacity-50" />
                <p className="text-gray-300 leading-relaxed mb-6 flex-grow">{item.review}</p>
                <div className="border-t border-white/10 pt-4 text-sm">
                  <p className="font-bold text-white">{item.name}</p>
                  <p className="text-yellow-400">{item.company}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full max-w-7xl border-t border-white/10 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} CoWatch. All Rights Reserved.</p>
          <p className="mt-2">A passion project for bringing people together, one stream at a time.</p>
        </footer>
      </div>
    </div>
  );
}