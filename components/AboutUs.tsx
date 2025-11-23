"use client";

import { Sparkles, Globe, Users, Zap, Award, Heart, Target, TrendingUp } from "lucide-react";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <section className="relative py-20 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920')] bg-cover bg-center opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl">
              <Sparkles className="text-white" size={40} />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            About GladysTravelAI
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
            Revolutionizing travel planning with the power of artificial intelligence
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <Target className="text-purple-600" size={32} />
                <h2 className="text-4xl font-bold text-gray-900">Our Mission</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                At GladysTravelAI, we believe that every journey should be extraordinary. Our mission is to make luxury travel accessible, personalized, and effortless through cutting-edge AI technology.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                We combine the wisdom of experienced travelers with the intelligence of advanced algorithms to create itineraries that match your unique preferences, budget, and dreams.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-8 shadow-xl">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Globe className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Global Reach</h3>
                    <p className="text-gray-700">150+ countries, 10,000+ destinations</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Trusted by Thousands</h3>
                    <p className="text-gray-700">50,000+ happy travelers worldwide</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Powered</h3>
                    <p className="text-gray-700">Instant itineraries tailored to you</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Our Story</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From a simple idea to a global travel revolution
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border-l-4 border-purple-600">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">2023 - The Beginning</h3>
              <p className="text-gray-700 leading-relaxed">
                Founded by a team of travel enthusiasts and AI experts who were frustrated with outdated travel planning tools. We asked ourselves: "What if AI could understand what makes a perfect trip for each person?"
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-8 border-l-4 border-pink-600">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">2024 - Growth & Innovation</h3>
              <p className="text-gray-700 leading-relaxed">
                Launched our AI-powered platform and served thousands of travelers. We integrated real-time data, user preferences, and machine learning to create the most personalized travel experiences possible.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8 border-l-4 border-red-600">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">2025 - The Future</h3>
              <p className="text-gray-700 leading-relaxed">
                Expanding globally with new features including AR travel previews, instant booking, and community-driven recommendations. Our goal: Make every traveler feel like they have a personal travel agent powered by AI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                <Heart className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Customer First</h3>
              <p className="text-gray-600 leading-relaxed">
                Your satisfaction and dream vacation are our top priorities, always.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
                <Zap className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Innovation</h3>
              <p className="text-gray-600 leading-relaxed">
                Constantly improving our AI to deliver better, smarter travel experiences.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center mb-6">
                <Award className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Excellence</h3>
              <p className="text-gray-600 leading-relaxed">
                We strive for perfection in every itinerary, booking, and interaction.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Growth</h3>
              <p className="text-gray-600 leading-relaxed">
                Empowering you to explore more, discover more, and grow more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-purple-600 to-pink-600">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Meet Our Team</h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-12">
            Passionate travelers and tech innovators working together to transform your journey
          </p>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-4xl mx-auto border border-white/20">
            <p className="text-lg text-white leading-relaxed">
              Our diverse team of AI engineers, travel experts, designers, and customer success specialists comes from all corners of the globe. We share a common passion: making travel magical for everyone. Together, we've created a platform that combines technology with human insight to deliver unforgettable experiences.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of travelers who trust GladysTravelAI for their adventures
          </p>
          <a
            href="/"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
          >
            <Sparkles size={24} />
            <span>Plan Your Trip Now</span>
          </a>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;