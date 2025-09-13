import { useState } from "react";

import { useNavigate } from "react-router-dom";
import useWheelSnap from "../../lib/useWheelSnap";

import Navbar from "../../components/navbar/Navbar";
import HomeHero from "../../components/homehero/HomeHero";
import Quiz from "../../components/quiz/quiz";
import Career from "../../components/career/career";

export default function Home() {
  useWheelSnap(["home", "quiz", "career", "about"], 800, 80, "page");

  return (
    <>
      <div className="overflow-hidden min-h-svh">
        <Navbar />
        <main
          id="page" // <-- ใช้ id นี้ให้นำทางเลื่อนได้ถูกคอนเทนเนอร์
          className="h-screen overflow-y-auto scroll-smooth snap-y snap-mandatory pt-16 hide-scrollbar"
        >
          <HomeHero holdMs={7200} fadeMs={220} />

          <Quiz />

          <Career />

          <section
            id="about"
            data-theme="dark"
            className="w-full h-screen snap-start flex items-center justify-center"
          >
            <div className="absolute inset-0 -z-10" />
            <div className="w-full px-6 text-center text-white">
              <h1 className="text-5xl md:text-6xl font-bold">
                About
              </h1>
              <p className="mt-4 opacity-90 max-w-xl mx-auto">
                เกี่ยวกับโปรเจค
              </p>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
