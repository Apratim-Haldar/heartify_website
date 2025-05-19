import React from "react"
import { useState, useEffect } from "react"
const MlForm = React.lazy(()=>import("../components/MlForm"))
import Navigation from "../components/Navigation"
import { Heart, Activity, ArrowRight } from "lucide-react"
import { useNavigate } from "react-router"
import axios from "axios"
import { io } from "socket.io-client"

const Dashboard = () => {
  const [animateHeart, setAnimateHeart] = useState(false)
  const navigate = useNavigate();
  const [heartRate, setHeartRate] = useState(null)
  const [userHeartifyID, setUserHeartifyID] = useState(null)

  useEffect(() => {
    // First, get the user's heartifyID from the verify-token endpoint
    const getUserInfo = async () => {
      try {
        const response = await axios.get('https://heartify-website.onrender.com/api/verify-token', {
          withCredentials: true
        });
        
        if (response.data.authenticated && response.data.user.heartifyID) {
          setUserHeartifyID(response.data.user.heartifyID);
          return response.data.user.heartifyID;
        }
        return null;
      } catch (error) {
        console.error("Error fetching user info:", error);
        return null;
      }
    };

    const interval = setInterval(() => {
      setAnimateHeart((prev) => !prev)
    }, 2000)
    
    const setupDataAndSocket = async () => {
      const heartifyID = await getUserInfo();
      
      if (!heartifyID) {
        console.error("No heartifyID found, cannot fetch heart rate data");
        return;
      }
      
      // Fetch initial heart rate data for this user
      try {
        const response = await axios.get(`https://heartify-website.onrender.com/maxHR`, {
          withCredentials: true
        });
        const data = response.data;
        if (data.length > 0) {
          setHeartRate(data[0].maxBPM);
        }
      } catch (error) {
        console.error("Error fetching initial heart rate:", error);
      }

      // Set up Socket.IO connection for real-time updates
      const socket = io("https://heartify-website.onrender.com", {
        withCredentials: true,
      });

      socket.on("connect", () => {
        console.log("Connected to WebSocket server");
        // Join a room specific to this user's heartifyID
        socket.emit('join', heartifyID);
      });

      // Listen for both the user-specific event and the general event
      socket.on(`heartRateUpdate:${heartifyID}`, (data) => {
        console.log("Received user-specific heart rate update:", data);
        setHeartRate(data.maxBPM);
        // Trigger heart animation on new data
        setAnimateHeart(true);
        setTimeout(() => setAnimateHeart(false), 1000);
      });

      // Also listen for the general heartRateUpdate event for backward compatibility
      socket.on("heartRateUpdate", (data) => {
        console.log("Received general heart rate update:", data);
        // Only update if the data is relevant to this user
        if (data.heartifyID === heartifyID || !data.heartifyID) {
          setHeartRate(data.maxBPM);
          // Trigger heart animation on new data
          setAnimateHeart(true);
          setTimeout(() => setAnimateHeart(false), 1000);
        }
      });

      socket.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error);
      });

      return () => {
        socket.disconnect();
      };
    };

    setupDataAndSocket();

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-rose-50">
      <Navigation />
      <div className="relative min-h-screen pt-20">
        {/* Background with overlay */}
        <div className="fixed inset-0 bg-cover bg-center z-0" style={{ backgroundImage: "url(/public/heartbg.avif)" }}>
          <div className="absolute inset-0 bg-gradient-to-b from-rose-900/70 to-pink-900/70 backdrop-blur-sm"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-center mb-10">
            <div className="bg-white/10 backdrop-blur-md rounded-full px-8 py-4 shadow-lg">
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
                <div
                  className={`mr-3 transition-transform duration-700 ease-in-out ${animateHeart ? "scale-110" : "scale-100"}`}
                >
                  <Heart className="h-8 w-8 text-pink-200 fill-pink-400" />
                </div>
                Heart Health Dashboard
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 flex items-center">
              <div className="bg-pink-100 p-4 rounded-xl">
                <Activity className="h-8 w-8 text-rose-500" />
              </div>
              <div className="ml-4">
                <div className="text-pink-200 text-sm">Current Heart Rate</div>
                <div className="text-white text-2xl font-bold">{heartRate}</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 flex items-center">
              <div className="bg-pink-100 p-4 rounded-xl">
                <Heart className="h-8 w-8 text-rose-500 fill-rose-200" />
              </div>
              <div className="ml-4">
                <div className="text-pink-200 text-sm">Heart Health Status</div>
                <div className="text-white text-2xl font-bold">Good</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 flex items-center group cursor-pointer">
              <div className="bg-pink-100 p-4 rounded-xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-rose-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-pink-200 text-sm">View Full Report</div>
                <div className="flex items-center">
                  <button onClick={()=>navigate("/analytics")} className="text-white text-lg font-medium flex items-center">Analytics
                  <ArrowRight className="ml-2 h-4 w-4 text-pink-200 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center items-center">
            <MlForm heartRate = {heartRate} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
