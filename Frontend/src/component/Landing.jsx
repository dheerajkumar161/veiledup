import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUserSecret, FaComments, FaUsers, FaBolt, FaEye, FaHeart, FaBookOpen, FaSignInAlt, FaUserPlus, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import logo from '../Assets/LOGO.png';

const features = [
  {
    icon: <FaUserSecret className="text-red-600" size={28} />, title: 'Complete Anonymity', description: 'Share your thoughts freely without revealing your identity. Your privacy is our priority.'
  },
  {
    icon: <FaComments className="text-red-600" size={28} />, title: 'Real-time Chat', description: 'Connect with others through private anonymous conversations with typing indicators and reactions.'
  },
  {
    icon: <FaUsers className="text-red-600" size={28} />, title: 'Communities', description: 'Join different communities like Hackathons, Academic, Cultural, Tech, and more.'
  },
  {
    icon: <FaBolt className="text-red-600" size={28} />, title: 'Trending Posts', description: 'Discover what\'s trending in your community and engage with popular content.'
  },
  {
    icon: <FaEye className="text-red-600" size={28} />, title: 'Content Filtering', description: 'Smart content moderation keeps discussions respectful and safe for everyone.'
  },
  {
    icon: <FaHeart className="text-red-600" size={28} />, title: 'Bookmarks & Likes', description: 'Save interesting posts and show appreciation with likes and reactions.'
  }
];

const howToSteps = [
  {
    step: '01', title: 'Join the Platform', description: 'Create your anonymous profile and customize your experience with complete privacy.', icon: <FaUsers className="text-red-600" size={22} />
  },
  {
    step: '02', title: 'Share Your Thoughts', description: 'Post text, images, or thoughts in relevant communities anonymously without any judgment.', icon: <FaComments className="text-red-600" size={22} />
  },
  {
    step: '03', title: 'Connect & Chat', description: 'Start private conversations with other anonymous users and build meaningful connections.', icon: <FaHeart className="text-red-600" size={22} />
  },
  {
    step: '04', title: 'Discover Content', description: 'Explore trending posts, bookmark favorites, and engage with the community safely.', icon: <FaBookOpen className="text-red-600" size={22} />
  }
];

export default function Landing() {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const cardsPerView = 3;
  const maxIndex = Math.max(0, features.length - cardsPerView);
  const handlePrev = () => setCarouselIndex(i => Math.max(0, i - 1));
  const handleNext = () => setCarouselIndex(i => Math.min(maxIndex, i + 1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <span className="text-white font-bold text-2xl">Veiled<span className="text-red-500">UP</span></span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <button className="flex items-center px-4 py-2 rounded-md border border-white text-white hover:bg-white hover:text-black transition font-semibold"><FaSignInAlt className="mr-2" size={16}/>Login</button>
              </Link>
              <Link to="/register">
                <button className="flex items-center px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition font-semibold"><FaUserPlus className="mr-2" size={16}/>Sign Up</button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-16 pb-16 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Veiled<span className="text-red-600">UP</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              The anonymous social platform where your thoughts matter, not your identity.<br/>
              <span className="text-gray-400">Share freely, connect safely, discover boldly.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register">
                <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg rounded-md font-semibold transition">Get Started</button>
              </Link>
              <Link to="/home">
                <button className="border border-white text-white hover:bg-white hover:text-black px-8 py-3 text-lg rounded-md font-semibold transition">Explore Communities</button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Carousel Section */}
        <section className="py-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose VeiledUP?</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Experience social networking without the pressure of identity. Connect authentically.
            </p>
          </div>
          <div className="relative flex items-center justify-center max-w-5xl mx-auto">
            <button onClick={handlePrev} disabled={carouselIndex === 0} className={`absolute left-0 z-10 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition text-white ${carouselIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}> <FaChevronLeft size={24} /> </button>
            <div className="flex gap-8 overflow-hidden w-full justify-center">
              {features.slice(carouselIndex, carouselIndex + cardsPerView).map((feature, idx) => (
                <div key={idx} className="bg-gray-900/80 border border-gray-700 rounded-xl p-8 shadow-lg flex flex-col items-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 min-w-[260px] max-w-[320px] w-full">
                  <div className="w-14 h-14 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 text-center">{feature.title}</h3>
                  <p className="text-gray-300 text-center">{feature.description}</p>
                </div>
              ))}
            </div>
            <button onClick={handleNext} disabled={carouselIndex === maxIndex} className={`absolute right-0 z-10 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition text-white ${carouselIndex === maxIndex ? 'opacity-30 cursor-not-allowed' : ''}`}> <FaChevronRight size={24} /> </button>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Getting started with VeiledUP is simple. Follow these steps to join our anonymous community.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {howToSteps.map((item, idx) => (
              <div key={idx} className="bg-gray-900/80 border border-gray-700 rounded-xl p-8 shadow-lg flex items-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-black rounded-full flex flex-col items-center justify-center mr-6">
                  <span className="text-white font-bold text-xl">{item.step}</span>
                  <span>{item.icon}</span>
                </div>
                <div className="ml-6">
                  <h4 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">{item.title}</h4>
                  <p className="text-gray-300 text-lg">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* About Section */}
        <section className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">About VeiledUP</h2>
              <div className="space-y-4 text-gray-300 text-lg">
                <p>
                  VeiledUP is more than just another social platform. It's a space where authenticity thrives 
                  without the constraints of identity. We believe that the best conversations happen when people 
                  feel free to express themselves without judgment.
                </p>
                <p>
                  Our platform combines the best of social networking with the freedom of anonymity. Whether 
                  you're sharing your thoughts on academic topics, discussing the latest hackathon, or just 
                  connecting with like-minded individuals, VeiledUP provides a safe space for real conversations.
                </p>
                <p>
                  Built with modern technology and designed with privacy in mind, VeiledUP ensures your 
                  interactions remain secure while fostering genuine connections.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl flex flex-col items-center">
                <div className="text-3xl font-bold text-white mb-2">8</div>
                <div className="text-gray-300 font-medium">Communities</div>
              </div>
              <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl flex flex-col items-center">
                <div className="text-3xl font-bold text-white mb-2">24/7</div>
                <div className="text-gray-300 font-medium">Active Chats</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 text-center">
          <div className="bg-gray-900 border border-gray-700 shadow-2xl rounded-xl max-w-3xl mx-auto">
            <div className="p-12">
              <h2 className="text-4xl font-bold text-white mb-4">Ready to Share Anonymously?</h2>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Join thousands of users who have found their voice on VeiledUP. 
                Your thoughts deserve to be heard, not judged.
              </p>
              <Link to="/register">
                <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg rounded-md font-semibold transition">Start Your Journey</button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}