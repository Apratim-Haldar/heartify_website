import React from "react"
import { useState, useEffect } from "react"
import Auth from "../components/Auth"
import { useNavigate } from "react-router-dom"
import { Heart, Activity, Shield, ArrowRight, ChevronDown } from "lucide-react"

const Landing = () => {
  const [showAuth, setShowAuth] = useState(false)
  const navigate = useNavigate()
  const [animateHeart, setAnimateHeart] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimateHeart((prev) => !prev)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const handleGetStarted = () => {
    setShowAuth(true)
  }

  const handleCancel = () => {
    setShowAuth(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      {showAuth && <Auth handleCancel={handleCancel} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <div
              className={`transition-transform duration-700 ease-in-out ${animateHeart ? "scale-110" : "scale-100"}`}
            >
              <Heart className="h-8 w-8 text-rose-500 fill-rose-500 mr-2" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
              Heartify
            </span>
          </div>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center px-5 py-2.5 border-2 border-rose-500 text-sm font-medium rounded-full text-rose-500 bg-white hover:bg-rose-50 focus:outline-none transition-all duration-200"
          >
            Sign In
          </button>
        </header>

        <main className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center px-4 py-2 bg-rose-100 text-rose-600 rounded-full text-sm font-medium">
                <span className="mr-2">❤️</span> Your Heart's Best Companion
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
                <span className="block">Monitor Your Heart</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-600">
                  With Precision & Care
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                Track, analyze, and optimize your heart health with our advanced monitoring system. Get real-time
                insights and personalized recommendations tailored to your unique health profile.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleGetStarted}
                  className="inline-flex items-center justify-center px-6 py-3.5 text-base font-medium rounded-full text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 group"
                >
                  <span className="relative z-10 flex items-center">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                  <span className="absolute right-0 w-12 h-full bg-white opacity-10 transform -skew-x-12 transition-transform duration-700 ease-in-out group-hover:translate-x-20"></span>
                </button>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center px-6 py-3.5 border-2 border-rose-200 text-base font-medium rounded-full text-rose-500 bg-white hover:bg-rose-50 shadow-sm hover:shadow transition-all duration-200"
                >
                  Learn More
                  <ChevronDown className="ml-2 h-5 w-5" />
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 to-pink-600 rounded-3xl blur-lg opacity-20"></div>
              <div className="relative overflow-hidden rounded-3xl shadow-2xl">
                <img src="/public/heartbg.png" alt="Heart Rate Monitoring" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                        <Heart className="h-6 w-6 text-rose-500 fill-rose-200" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm text-gray-500">Current Heart Rate</div>
                        <div className="text-2xl font-bold text-rose-500">78 BPM</div>
                      </div>
                      <div className="ml-auto">
                        <div className="text-xs text-gray-500">Status</div>
                        <div className="text-sm font-medium text-green-500">Healthy</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <section id="features" className="py-20">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-rose-100 text-rose-600 rounded-full text-sm font-medium mb-4">
              <span className="mr-2">✨</span> Features
            </div>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Why Choose Heartify?</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Our comprehensive heart monitoring solution provides everything you need to maintain optimal heart health.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden group">
              <div className="h-3 bg-gradient-to-r from-rose-400 to-pink-500"></div>
              <div className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mb-6 group-hover:bg-rose-200 transition-colors duration-300">
                  <Activity className="h-8 w-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Real-time Monitoring</h3>
                <p className="text-gray-600 mb-6">
                  Track your heart rate in real-time with accurate measurements and instant alerts for abnormal
                  patterns. Our advanced algorithms detect irregularities before they become problems.
                </p>
                <a href="#" className="text-rose-500 hover:text-rose-700 font-medium flex items-center text-sm">
                  Learn more
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden group">
              <div className="h-3 bg-gradient-to-r from-rose-400 to-pink-500"></div>
              <div className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mb-6 group-hover:bg-rose-200 transition-colors duration-300">
                  <Heart className="h-8 w-8 text-rose-500 fill-rose-200" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Advanced Analytics</h3>
                <p className="text-gray-600 mb-6">
                  Access detailed analytics and visualizations to understand your heart health trends over time. Get
                  personalized insights based on your unique heart patterns and lifestyle.
                </p>
                <a href="#" className="text-rose-500 hover:text-rose-700 font-medium flex items-center text-sm">
                  Learn more
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden group">
              <div className="h-3 bg-gradient-to-r from-rose-400 to-pink-500"></div>
              <div className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mb-6 group-hover:bg-rose-200 transition-colors duration-300">
                  <Shield className="h-8 w-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Secure Data</h3>
                <p className="text-gray-600 mb-6">
                  Your health data is encrypted and securely stored with enterprise-grade security protocols. We
                  prioritize your privacy and ensure your sensitive information remains protected.
                </p>
                <a href="#" className="text-rose-500 hover:text-rose-700 font-medium flex items-center text-sm">
                  Learn more
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="bg-gradient-to-r from-rose-100 to-pink-100 rounded-3xl p-10 md:p-16 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-pink-300 opacity-20 rounded-full blur-3xl"></div>
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-rose-300 opacity-20 rounded-full blur-3xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="md:w-2/3">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Ready to monitor your heart health?</h2>
                <p className="mt-4 text-lg text-gray-700 max-w-2xl">
                  Join thousands of users who trust Heartify for their heart health monitoring needs. Start your journey
                  to better heart health today.
                </p>
              </div>
              <div>
                <button
                  onClick={handleGetStarted}
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-full text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 group"
                >
                  <span className="relative z-10 flex items-center">
                    Get Started Now
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                  <span className="absolute right-0 w-12 h-full bg-white opacity-10 transform -skew-x-12 transition-transform duration-700 ease-in-out group-hover:translate-x-20"></span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer className="py-12 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center">
              <Heart className="h-6 w-6 text-rose-500 fill-rose-500 mr-2" />
              <span className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
                Heartify
              </span>
            </div>
            <div className="mt-4 md:mt-0 text-sm text-gray-500">
              © {new Date().getFullYear()} Heartify. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default Landing
