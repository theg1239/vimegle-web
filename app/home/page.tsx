// pages/index.tsx

import React from 'react';
import Head from 'next/head';
import Header from '../components/header';
import Hero from '../components/hero';
import Features from '../components/features';
import Footer from '../components/footer';

const Home: React.FC = () => {
  return (
    <>
      <Head>
        <title>Vomegle - Connect with Strangers Instantly</title>
        <meta name="description" content="Experience real-time video and text chat with people around the world. No sign-up required!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="relative">
        <Header />
        <main className="pt-16">
          <Hero />
        </main>
      </div>
    </>
  );
};

export default Home;
