import React from "react"
import { useState, useEffect, useRef } from "react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js"
import Navigation from "../components/Navigation"
import { Heart, TrendingUp, TrendingDown, Activity, Calendar, Clock, ChevronRight } from "lucide-react"
import { io } from "socket.io-client"
import axios from "axios"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface HeartRateData {
  date?: string
  week?: string
  maxBPM: number
  avgBPM: number
  minBPM: number
  createdAt?: string
}

const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">("daily")
  const [dailyData, setDailyData] = useState<HeartRateData[]>([])
  const [weeklyData, setWeeklyData] = useState<HeartRateData[]>([])
  const [monthlyData, setMonthlyData] = useState<HeartRateData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [userHeartifyID, setUserHeartifyID] = useState<string | null>(null)
  const socketRef = useRef<any>(null)
  const chartRef = useRef<any>(null)

  // Function to get user's heartifyID
  const getUserHeartifyID = async () => {
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
      setError("Unable to authenticate user. Please log in again.");
      return null;
    }
  };

  // Function to fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Ensure we have the user's heartifyID
      const heartifyID = userHeartifyID || await getUserHeartifyID();
      
      if (!heartifyID) {
        throw new Error("User authentication required");
      }

      // Fetch all data in parallel
      const [dailyResponse, weeklyResponse, monthlyResponse] = await Promise.all([
        fetch("https://heartify-website.onrender.com/api/heart-rate/daily", { credentials: "include" }),
        fetch("https://heartify-website.onrender.com/api/heart-rate/weekly", { credentials: "include" }),
        fetch("https://heartify-website.onrender.com/api/heart-rate/monthly", { credentials: "include" }),
      ]);

      if (!dailyResponse.ok) throw new Error("Failed to fetch daily data");
      if (!weeklyResponse.ok) throw new Error("Failed to fetch weekly data");
      if (!monthlyResponse.ok) throw new Error("Failed to fetch monthly data");

      const daily = await dailyResponse.json();
      const weekly = await weeklyResponse.json();
      const monthly = await monthlyResponse.json();

      setDailyData(daily);
      setWeeklyData(weekly);
      setMonthlyData(monthly);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching heart rate data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial setup
    const setupAnalytics = async () => {
      // Get user's heartifyID first
      const heartifyID = await getUserHeartifyID();
      
      if (!heartifyID) {
        setError("User authentication required");
        setLoading(false);
        return;
      }
      
      // Initial data fetch
      await fetchAllData();

      // Set up Socket.IO connection
      socketRef.current = io("https://heartify-website.onrender.com", {
        withCredentials: true,
      });

      // Inside the useEffect where you set up the socket connection
      
      socketRef.current.on("connect", () => {
        console.log("Analytics connected to WebSocket server");
        // Join room specific to this user
        socketRef.current.emit('join', heartifyID);
      });
      
      // Listen for updates specific to this user
      socketRef.current.on(`heartRateUpdate:${heartifyID}`, (data) => {
        console.log("Analytics received real-time heart rate update:", data);
        
        // Update data based on operation type
        if (data.operation === 'insert' || data.operation === 'update' || data.operation === 'latest') {
          // For daily data, add the new entry if it's from today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dataDate = new Date(data.timestamp);
          
          if (dataDate >= today) {
            // Update daily data
            setDailyData(prevData => {
              // Create a copy of the previous data
              const newData = [...prevData];
              
              // Check if we should add a new entry or update an existing one
              const existingIndex = newData.findIndex(item => 
                new Date(item.createdAt).getTime() === dataDate.getTime()
              );
              
              if (existingIndex >= 0) {
                // Update existing entry
                newData[existingIndex] = {
                  ...newData[existingIndex],
                  maxBPM: data.maxBPM,
                  avgBPM: data.avgBPM,
                  minBPM: data.minBPM,
                };
              } else {
                // Add new entry
                newData.push({
                  maxBPM: data.maxBPM,
                  avgBPM: data.avgBPM,
                  minBPM: data.minBPM,
                  createdAt: data.timestamp
                });
                
                // Sort by creation time
                newData.sort((a, b) => 
                  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
              }
              
              return newData;
            });
          }
          
          // For weekly and monthly data, we need to recalculate aggregates
          // This is more complex, so we'll fetch those less frequently
          const lastUpdateTime = sessionStorage.getItem('lastAggregateUpdate');
          const now = Date.now();
          
          // Only update aggregates every 30 seconds to avoid too many refreshes
          if (!lastUpdateTime || now - parseInt(lastUpdateTime) > 30000) {
            // Update weekly and monthly data in the background
            Promise.all([
              fetch("https://heartify-website.onrender.com/api/heart-rate/weekly", { credentials: "include" }),
              fetch("https://heartify-website.onrender.com/api/heart-rate/monthly", { credentials: "include" })
            ]).then(([weeklyResponse, monthlyResponse]) => {
              if (weeklyResponse.ok && monthlyResponse.ok) {
                return Promise.all([weeklyResponse.json(), monthlyResponse.json()]);
              }
              throw new Error("Failed to fetch aggregate data");
            }).then(([weekly, monthly]) => {
              setWeeklyData(weekly);
              setMonthlyData(monthly);
              sessionStorage.setItem('lastAggregateUpdate', now.toString());
            }).catch(err => {
              console.error("Error updating aggregate data:", err);
            });
          }
        } else if (data.operation === 'delete') {
          // Handle deletion by removing the entry if it exists in our datasets
          if (data.documentId) {
            // For daily data, we can remove the specific entry
            setDailyData(prevData => 
              prevData.filter(item => item._id !== data.documentId)
            );
            
            // For weekly and monthly, we should refresh the data
            // But we'll do it with the same throttling as above
            const lastUpdateTime = sessionStorage.getItem('lastAggregateUpdate');
            const now = Date.now();
            
            if (!lastUpdateTime || now - parseInt(lastUpdateTime) > 30000) {
              Promise.all([
                fetch("https://heartify-website.onrender.com/api/heart-rate/weekly", { credentials: "include" }),
                fetch("https://heartify-website.onrender.com/api/heart-rate/monthly", { credentials: "include" })
              ]).then(([weeklyResponse, monthlyResponse]) => {
                if (weeklyResponse.ok && monthlyResponse.ok) {
                  return Promise.all([weeklyResponse.json(), monthlyResponse.json()]);
                }
                throw new Error("Failed to fetch aggregate data");
              }).then(([weekly, monthly]) => {
                setWeeklyData(weekly);
                setMonthlyData(monthly);
                sessionStorage.setItem('lastAggregateUpdate', now.toString());
              }).catch(err => {
                console.error("Error updating aggregate data:", err);
              });
            }
          }
        }
        
        // Visual feedback that new data arrived - only for the active chart
        if (chartRef.current) {
          // Add a subtle animation to the chart container
          const chartContainer = chartRef.current.parentNode;
          if (chartContainer) {
            chartContainer.classList.add("pulse-animation");
            setTimeout(() => {
              chartContainer.classList.remove("pulse-animation");
            }, 1000);
          }
        }
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error);
      });
    };

    setupAnalytics();

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      sessionStorage.removeItem('lastAggregateUpdate');
    };
  }, []);

  // Rest of your component remains the same
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          font: {
            size: 12,
            weight: "bold",
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#be185d",
        bodyColor: "#1e293b",
        borderColor: "#fce7f3",
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw} BPM`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: "rgba(252, 231, 243, 0.5)",
        },
        ticks: {
          font: {
            size: 11,
          },
        },
        title: {
          display: true,
          text: "BPM",
          font: {
            size: 12,
            weight: "bold",
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
    elements: {
      line: {
        tension: 0.3,
      },
      point: {
        radius: 3,
        hoverRadius: 5,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
  }

  const getChartData = () => {
    let data: HeartRateData[] = []
    let labels: string[] = []

    switch (activeTab) {
      case "daily":
        data = dailyData
        labels = data.map((item) => formatTime(item.createdAt || ""))
        break
      case "weekly":
        data = weeklyData
        labels = data.map((item) => item.date || "")
        break
      case "monthly":
        data = monthlyData
        labels = data.map((item) => item.week || "")
        break
    }

    return {
      labels,
      datasets: [
        {
          label: "Max BPM",
          data: data.map((item) => item.maxBPM),
          borderColor: "rgb(220, 38, 38)", 
          backgroundColor: "rgba(220, 38, 38, 0.5)",
          borderWidth: 2,
          pointBackgroundColor: "rgb(220, 38, 38)",
        },
        {
          label: "Average BPM",
          data: data.map((item) => item.avgBPM),
          borderColor: "rgb(79, 70, 229)", 
          backgroundColor: "rgba(79, 70, 229, 0.5)",
          borderWidth: 2,
          pointBackgroundColor: "rgb(79, 70, 229)",
        },
        {
          label: "Min BPM",
          data: data.map((item) => item.minBPM),
          borderColor: "rgb(16, 185, 129)", 
          backgroundColor: "rgba(16, 185, 129, 0.5)",
          borderWidth: 2,
          pointBackgroundColor: "rgb(16, 185, 129)",
        },
      ],
    }
  }

  const renderStats = () => {
    const data = activeTab === "daily" ? dailyData : activeTab === "weekly" ? weeklyData : monthlyData

    if (data.length === 0) return null

    // Calculate averages
    const avgMax = Math.round(data.reduce((sum, item) => sum + item.maxBPM, 0) / data.length)
    const avgAvg = Math.round(data.reduce((sum, item) => sum + item.avgBPM, 0) / data.length)
    const avgMin = Math.round(data.reduce((sum, item) => sum + item.minBPM, 0) / data.length)

    // Find highest and lowest
    const highestBPM = Math.max(...data.map((item) => item.maxBPM))
    const lowestBPM = Math.min(...data.map((item) => item.minBPM))

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden border-2 border-pink-100 group hover:border-pink-200 transition-colors duration-300">
          <div className="px-6 py-5 bg-gradient-to-r from-pink-50 to-rose-50 border-b-2 border-pink-100 group-hover:border-pink-200 transition-colors duration-300">
            <div className="flex items-center">
              <Activity className="h-6 w-6 text-rose-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Average Heart Rate</h3>
            </div>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-rose-500">{avgAvg}</span>
              <span className="ml-2 text-gray-500 font-medium">BPM</span>
            </div>
            <div className="mt-3 text-sm text-gray-600 flex items-center">
              <span>Range: </span>
              <span className="font-medium text-pink-600 ml-1">{avgMin}</span>
              <span className="mx-1">-</span>
              <span className="font-medium text-rose-600">{avgMax}</span>
              <span className="ml-1">BPM</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg overflow-hidden border-2 border-pink-100 group hover:border-pink-200 transition-colors duration-300">
          <div className="px-6 py-5 bg-gradient-to-r from-rose-50 to-red-50 border-b-2 border-pink-100 group-hover:border-pink-200 transition-colors duration-300">
            <div className="flex items-center">
              <TrendingUp className="h-6 w-6 text-rose-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Highest Recorded</h3>
            </div>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-rose-500">{highestBPM}</span>
              <span className="ml-2 text-gray-500 font-medium">BPM</span>
            </div>
            <div className="mt-3 text-sm text-gray-600 flex items-center">
              {activeTab === "daily" ? (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-rose-400" />
                  <span>Today</span>
                </div>
              ) : activeTab === "weekly" ? (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-rose-400" />
                  <span>This Week</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-rose-400" />
                  <span>This Month</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg overflow-hidden border-2 border-pink-100 group hover:border-pink-200 transition-colors duration-300">
          <div className="px-6 py-5 bg-gradient-to-r from-pink-50 to-rose-50 border-b-2 border-pink-100 group-hover:border-pink-200 transition-colors duration-300">
            <div className="flex items-center">
              <TrendingDown className="h-6 w-6 text-pink-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Lowest Recorded</h3>
            </div>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-pink-500">{lowestBPM}</span>
              <span className="ml-2 text-gray-500 font-medium">BPM</span>
            </div>
            <div className="mt-3 text-sm text-gray-600 flex items-center">
              {activeTab === "daily" ? (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-pink-400" />
                  <span>Today</span>
                </div>
              ) : activeTab === "weekly" ? (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-pink-400" />
                  <span>This Week</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-pink-400" />
                  <span>This Month</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-rose-50">
      <Navigation />

      <style jsx global>{`
        @keyframes pulse-animation {
          0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(244, 63, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
        }
        
        .pulse-animation {
          animation: pulse-animation 1s ease-out;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
              <Heart className="h-7 w-7 text-rose-500 fill-rose-200 mr-2" />
              Heart Rate Analytics
            </h1>
            <p className="mt-1 text-gray-600">Monitor and analyze your heart rate patterns over time</p>
          </div>

          <div className="mt-4 md:mt-0">
            <div className="bg-white p-1 rounded-full shadow-md inline-flex">
              <button
                className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  activeTab === "daily"
                    ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-rose-50"
                }`}
                onClick={() => setActiveTab("daily")}
              >
                Daily
              </button>
              <button
                className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  activeTab === "weekly"
                    ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-rose-50"
                }`}
                onClick={() => setActiveTab("weekly")}
              >
                Weekly
              </button>
              <button
                className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  activeTab === "monthly"
                    ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-rose-50"
                }`}
                onClick={() => setActiveTab("monthly")}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16">
                <div className="absolute top-0 left-0 right-0 bottom-0 animate-ping rounded-full bg-rose-400 opacity-75"></div>
                <div className="relative flex justify-center items-center w-16 h-16 rounded-full bg-rose-500">
                  <Heart className="h-8 w-8 text-white" />
                </div>
              </div>
              <p className="mt-4 text-gray-600">Loading your heart rate data...</p>
            </div>
          </div>
        ) : error ? (
          <div
            className="bg-rose-50 border-2 border-rose-200 text-rose-700 px-6 py-5 rounded-3xl shadow-lg"
            role="alert"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-rose-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-rose-800">Error loading data</h3>
                <div className="mt-1 text-sm text-rose-700">{error}</div>
                <div className="mt-3">
                  <button
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-rose-700 bg-rose-100 hover:bg-rose-200 focus:outline-none transition-colors duration-200"
                    onClick={() => fetchAllData()}
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            {renderStats()}

            {/* Chart */}
            <div className="bg-white p-6 rounded-3xl shadow-lg border-2 border-pink-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Activity className="h-5 w-5 text-rose-500 mr-2" />
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Heart Rate Trends
                </h2>
                <div className="text-sm text-gray-500">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                  Live updates enabled
                </div>
              </div>

              {(activeTab === "daily" && dailyData.length === 0) ||
              (activeTab === "weekly" && weeklyData.length === 0) ||
              (activeTab === "monthly" && monthlyData.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <Heart className="h-16 w-16 text-pink-200 mb-4" />
                  <p className="text-lg font-medium">No data available for this time period</p>
                  <p className="text-sm mt-2">Check back later or switch to a different time period</p>
                </div>
              ) : (
                <div className="h-80" ref={chartRef}>
                  <Line options={chartOptions} data={getChartData()} />
                </div>
              )}
            </div>

            {/* Additional insights section remains commented out as in original */}
          </>
        )}
      </div>
    </div>
  )
}

export default Analytics
