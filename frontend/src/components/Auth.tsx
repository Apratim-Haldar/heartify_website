import React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { useCookies } from "react-cookie"
import { Heart, Mail, Lock, User, X, ArrowRight } from 'lucide-react'

type prop = {
  handleCancel: () => void
}

export default function Auth({ handleCancel }: prop) {
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [cookiesds, setCookie] = useCookies(["authToken"])
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [animateHeart, setAnimateHeart] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimateHeart(prev => !prev)
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)

    try {
      const endpoint = isSignUp ? "/api/signup" : "/api/login"
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
          heartifyID: formData.get("heartifyID"),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Authentication failed")
      }

      const data = await response.json()
      navigate("/dashboard")
    } catch (error) {
      console.error("Authentication failed:", error)
      setError(error instanceof Error ? error.message : "Authentication failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none z-10"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-8 text-white relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-32 h-32 bg-pink-400 opacity-20 rounded-full blur-xl"></div>
          <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-rose-300 opacity-20 rounded-full blur-xl"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className={`transition-transform duration-700 ease-in-out ${animateHeart ? 'scale-110' : 'scale-100'}`}>
              <Heart className="h-10 w-10 fill-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Heartify</h2>
              <p className="text-pink-100 text-sm">Your heart's best companion</p>
            </div>
          </div>
          
          <p className="mt-4 text-pink-100 relative z-10">
            {isSignUp ? "Create your account to start monitoring your heart health" : "Welcome back! Sign in to continue your heart health journey"}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-200 text-rose-700 rounded-xl text-sm flex items-start gap-2">
              <div className="mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="block font-medium text-gray-700 text-sm" htmlFor="name">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-pink-400" />
                  </div>
                  <input
                    className="pl-10 block w-full rounded-xl border-2 border-pink-100 bg-white py-3 text-gray-900 focus:border-pink-400 focus:outline-none transition-colors"
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    type="text"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block font-medium text-gray-700 text-sm" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-pink-400" />
                </div>
                <input
                  className="pl-10 block w-full rounded-xl border-2 border-pink-100 bg-white py-3 text-gray-900 focus:border-pink-400 focus:outline-none transition-colors"
                  id="email"
                  name="email"
                  placeholder="name@example.com"
                  type="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-gray-700 text-sm" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-pink-400" />
                </div>
                <input
                  className="pl-10 block w-full rounded-xl border-2 border-pink-100 bg-white py-3 text-gray-900 focus:border-pink-400 focus:outline-none transition-colors"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type="password"
                  required
                  minLength={8}
                />
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-1.5">
                <label className="block font-medium text-gray-700 text-sm" htmlFor="heartifyID">
                  Heartify ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Heart className="h-5 w-5 text-pink-400" />
                  </div>
                  <input
                    className="pl-10 block w-full rounded-xl border-2 border-pink-100 bg-white py-3 text-gray-900 focus:border-pink-400 focus:outline-none transition-colors"
                    id="heartifyID"
                    name="heartifyID"
                    placeholder="Your Heartify ID"
                    type="text"
                    required
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-medium py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex justify-center items-center relative overflow-hidden group"
                type="submit"
                disabled={isLoading}
              >
                <span className="absolute right-0 w-12 h-full bg-white opacity-10 transform -skew-x-12 transition-transform duration-700 ease-in-out group-hover:translate-x-20"></span>
                {isLoading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  <>
                    {isSignUp ? "Create Account" : "Sign In"}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <button
                  type="button"
                  className="font-medium text-rose-500 hover:text-rose-700 focus:outline-none transition-colors"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

