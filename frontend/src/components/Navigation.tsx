import React from "react"
import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Heart, LogOut, Menu, X, Activity, User } from "lucide-react"

const Navigation: React.FC = () => {
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("https://heartify-website.onrender.com/api/logout", {
        method: "POST",
        credentials: "include",
      })
      window.location.href = "/"
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/90 backdrop-blur-md shadow-md" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 md:h-20">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <div className="relative">
                <Heart
                  className={`h-8 w-8 text-rose-500 fill-rose-500 transition-all duration-300 ${scrolled ? "animate-none" : "animate-pulse"}`}
                />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                </span>
              </div>
              <span className="ml-2 text-2xl font-bold bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
                Heartify
              </span>
            </Link>
            <div className="hidden md:flex md:ml-10 md:space-x-8">
              <Link
                to="/dashboard"
                className={`${
                  location.pathname === "/dashboard" ? "text-rose-500 font-medium" : "text-gray-600 hover:text-rose-400"
                } inline-flex items-center px-1 pt-1 text-sm transition-colors duration-200 relative`}
              >
                {location.pathname === "/dashboard" && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-pink-600 rounded-full"></span>
                )}
                Dashboard
              </Link>
              <Link
                to="/analytics"
                className={`${
                  location.pathname === "/analytics" ? "text-rose-500 font-medium" : "text-gray-600 hover:text-rose-400"
                } inline-flex items-center px-1 pt-1 text-sm transition-colors duration-200 relative`}
              >
                {location.pathname === "/analytics" && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-pink-600 rounded-full"></span>
                )}
                Analytics
              </Link>
            </div>
          </div>

          <div className="hidden md:flex md:items-center">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border-2 border-rose-500 text-sm font-medium rounded-full text-rose-500 bg-white hover:bg-rose-50 focus:outline-none transition-all duration-200 mr-3"
              onClick={() => {}}
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </button>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 focus:outline-none shadow-md hover:shadow-lg transition-all duration-200"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>

          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-rose-500 hover:bg-rose-50 focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out transform ${isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10 pointer-events-none"}`}
      >
        <div className="pt-2 pb-3 space-y-1 bg-white shadow-lg rounded-b-3xl mx-4">
          <Link
            to="/dashboard"
            className={`${
              location.pathname === "/dashboard"
                ? "bg-gradient-to-r from-rose-50 to-pink-50 border-l-4 border-rose-500 text-rose-500"
                : "border-l-4 border-transparent text-gray-600 hover:bg-rose-50 hover:text-rose-500"
            } block pl-3 pr-4 py-3 text-base font-medium transition-colors duration-200 flex items-center`}
            onClick={() => setIsMenuOpen(false)}
          >
            <Heart className={`h-5 w-5 mr-2 ${location.pathname === "/dashboard" ? "fill-rose-200" : ""}`} />
            Dashboard
          </Link>
          <Link
            to="/analytics"
            className={`${
              location.pathname === "/analytics"
                ? "bg-gradient-to-r from-rose-50 to-pink-50 border-l-4 border-rose-500 text-rose-500"
                : "border-l-4 border-transparent text-gray-600 hover:bg-rose-50 hover:text-rose-500"
            } block pl-3 pr-4 py-3 text-base font-medium transition-colors duration-200 flex items-center`}
            onClick={() => setIsMenuOpen(false)}
          >
            <Activity className="h-5 w-5 mr-2" />
            Analytics
          </Link>
          <button
            className="w-full text-left border-l-4 border-transparent text-gray-600 hover:bg-rose-50 hover:text-rose-500 block pl-3 pr-4 py-3 text-base font-medium transition-colors duration-200 flex items-center"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
