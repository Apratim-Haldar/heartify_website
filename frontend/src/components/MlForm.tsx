import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import axios from "axios"
import React from "react"
import { Heart, AlertCircle, Activity, ArrowRight, X } from "lucide-react"
import { io } from "socket.io-client"

const ResultModal = ({ isOpen, onClose, result, error }) => {
  const modalRef = useRef(null)

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose()
    }

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.addEventListener("mousedown", handleClickOutside)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.removeEventListener("mousedown", handleClickOutside)
      document.body.style.overflow = "auto"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true"></div>

      <div
        ref={modalRef}
        className={`relative w-full max-w-md transform transition-all duration-300 ease-in-out ${isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
        role="dialog"
        aria-modal="true"
      >
        {error ? (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-6 relative">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-pink-400 opacity-20 rounded-full blur-xl"></div>
              <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-rose-300 opacity-20 rounded-full blur-xl"></div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Error</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700">{`Unexpected Server Error: ${error}`}</p>
              <div className="mt-6 flex justify-end">
                <button
                  className="px-5 py-2.5 bg-rose-100 text-rose-600 rounded-xl font-medium text-sm hover:bg-rose-200 transition-colors"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div
              className={`p-6 relative ${
                result === "The patient has high risk of heart disease"
                  ? "bg-gradient-to-r from-rose-500 to-red-600"
                  : "bg-gradient-to-r from-emerald-500 to-green-600"
              }`}
            >
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white opacity-10 rounded-full blur-xl"></div>
              <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white opacity-10 rounded-full blur-xl"></div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full">
                    {result === "The patient has high risk of heart disease" ? (
                      <AlertCircle className="h-6 w-6 text-white" />
                    ) : (
                      <Heart className="h-6 w-6 text-white fill-white/30" />
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {result === "The patient has high risk of heart disease"
                      ? "High Risk Detected"
                      : "Low Risk Detected"}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 text-lg">{result}</p>

              {result === "The patient has high risk of heart disease" && (
                <div className="mt-5 p-4 bg-rose-50 rounded-xl border border-rose-200">
                  <p className="text-sm text-rose-600 font-medium">
                    We recommend consulting with a healthcare professional for a comprehensive evaluation as soon as
                    possible.
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                    result === "The patient has high risk of heart disease"
                      ? "bg-rose-100 text-rose-600 hover:bg-rose-200"
                      : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                  }`}
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const MlForm = ({ heartRate: propHeartRate }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()
  const [heartRate, setHeartRate] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Update local state when prop changes
    if (propHeartRate !== null) {
      setHeartRate(propHeartRate)
    }
  }, [propHeartRate])

  useEffect(() => {
    // Only set up socket connection if we don't have a prop value
    if (propHeartRate === null) {
      const fetchInitialHeartRate = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/maxHR`)
          const data = response.data
          if (data.length > 0) {
            setHeartRate(data[0].maxBPM)
          }
        } catch (error) {
          console.error("Error fetching heart rate:", error)
        }
      }

      fetchInitialHeartRate()

      // Set up Socket.IO connection for real-time updates
      const socket = io("http://localhost:5000", {
        withCredentials: true,
      })

      socket.on("connect", () => {
        console.log("MlForm connected to WebSocket server")
      })

      socket.on("heartRateUpdate", (data) => {
        console.log("MlForm received real-time heart rate update:", data)
        setHeartRate(data.maxBPM)
      })

      return () => {
        socket.disconnect()
      }
    }
  }, [propHeartRate])

  const onSubmit = async (values) => {
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const response = await axios.post("http://localhost:5100/predict", {
        ...values,
        latest_maxHR: heartRate,
      })
      setResult(response.data.message)
      setShowModal(true)
    } catch (error) {
      setError(error)
      setShowModal(true)
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-500 to-pink-600 rounded-t-3xl p-8 shadow-lg">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-pink-400 opacity-20 rounded-full blur-xl"></div>
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-rose-300 opacity-20 rounded-full blur-xl"></div>
        <h1 className="font-bold text-2xl md:text-3xl text-white flex items-center gap-2 relative z-10">
          <Heart className="h-7 w-7 fill-white" />
          Heart Disease Prediction Portal
        </h1>
        <p className="text-pink-100 mt-2 relative z-10">
          Complete the form below for your personalized heart health assessment
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 p-8 bg-white rounded-b-3xl shadow-lg border-2 border-t-0 border-pink-100"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex justify-between font-medium text-gray-700">
              Age
              {errors.age && <span className="text-sm text-rose-500">Required (1-99)</span>}
            </label>
            <div className="relative">
              <input
                type="number"
                className={`w-full px-4 py-3 rounded-2xl border-2 ${
                  errors.age ? "border-rose-300 focus:border-rose-500" : "border-pink-100 focus:border-pink-400"
                } focus:outline-none transition-colors duration-200`}
                placeholder="Enter your age"
                {...register("age", { required: true, min: 1, max: 99 })}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-pink-300 text-sm">years</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex justify-between font-medium text-gray-700">
              Sex
              {errors.sex && <span className="text-sm text-rose-500">Required</span>}
            </label>
            <select
              className={`w-full px-4 py-3 rounded-2xl border-2 ${
                errors.sex ? "border-rose-300 focus:border-rose-500" : "border-pink-100 focus:border-pink-400"
              } focus:outline-none transition-colors duration-200 bg-white appearance-none`}
              {...register("sex", { required: true })}
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ec4899'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 1rem center",
                backgroundSize: "1.5em 1.5em",
              }}
            >
              <option value="">Select Your Sex</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-gray-700">Chest Pain Type</label>
            <select
              className="w-full px-4 py-3 rounded-2xl border-2 border-pink-100 focus:border-pink-400 focus:outline-none transition-colors duration-200 bg-white appearance-none"
              {...register("CpainType", { required: true })}
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ec4899'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 1rem center",
                backgroundSize: "1.5em 1.5em",
              }}
            >
              <option value="">Select Chest Pain Type</option>
              <option value="TA">Typical Angina</option>
              <option value="ATA">Atypical Angina</option>
              <option value="NAP">Non-Anginal Pain</option>
              <option value="ASY">Asymptomatic</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-gray-700">Resting BP (mm Hg)</label>
            <div className="relative">
              <input
                className="w-full px-4 py-3 rounded-2xl border-2 border-pink-100 focus:border-pink-400 focus:outline-none transition-colors duration-200"
                type="number"
                placeholder="Enter your Resting BP"
                {...register("RestingBP", { required: true, min: 0, max: 300 })}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-pink-300 text-sm">mm Hg</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-5 border-2 border-pink-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-pink-100 p-2 rounded-full">
              <Heart className="h-5 w-5 text-pink-600 fill-pink-200" />
            </div>
            <h2 className="text-md font-medium text-gray-800">
              Current Heart Rate
              <span className="ml-2 text-sm text-pink-500">(Automatically fetched from your heartify)</span>
            </h2>
          </div>
          <div className="flex items-center">
            <div className="text-3xl font-bold text-rose-600">{heartRate !== null ? heartRate : "--"}</div>
            <div className="ml-2 text-lg text-rose-400 font-medium">BPM</div>
            {heartRate !== null && (
              <div className="ml-auto flex items-center text-sm text-pink-600 bg-pink-100 px-3 py-1 rounded-full">
                <Activity className="h-4 w-4 mr-1" />
                Live
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="font-medium text-gray-700">Cholesterol</label>
            <div className="relative">
              <input
                className="w-full px-4 py-3 rounded-2xl border-2 border-pink-100 focus:border-pink-400 focus:outline-none transition-colors duration-200"
                type="number"
                placeholder="Enter your Cholesterol level"
                {...register("Cholestrol", { required: true, min: 0, max: 600 })}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-pink-300 text-sm">mg/dL</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-gray-700">Fasting BP (mm Hg)</label>
            <div className="relative">
              <input
                className="w-full px-4 py-3 rounded-2xl border-2 border-pink-100 focus:border-pink-400 focus:outline-none transition-colors duration-200"
                type="number"
                placeholder="Enter your Fasting BP"
                {...register("FastingBP", { required: true, min: 0, max: 300 })}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-pink-300 text-sm">mm Hg</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-gray-700">Resting ECG</label>
            <select
              className="w-full px-4 py-3 rounded-2xl border-2 border-pink-100 focus:border-pink-400 focus:outline-none transition-colors duration-200 bg-white appearance-none"
              {...register("RestingECG", { required: true })}
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ec4899'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 1rem center",
                backgroundSize: "1.5em 1.5em",
              }}
            >
              <option value="">Select Resting ECG</option>
              <option value="Normal">Normal</option>
              <option value="ST">ST</option>
              <option value="LVH">LVH</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-gray-700">Exercise Induced Angina</label>
            <select
              className="w-full px-4 py-3 rounded-2xl border-2 border-pink-100 focus:border-pink-400 focus:outline-none transition-colors duration-200 bg-white appearance-none"
              {...register("Angina", { required: true })}
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ec4899'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 1rem center",
                backgroundSize: "1.5em 1.5em",
              }}
            >
              <option value="">Select Yes or No</option>
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-gray-700">ST Slope</label>
            <select
              className="w-full px-4 py-3 rounded-2xl border-2 border-pink-100 focus:border-pink-400 focus:outline-none transition-colors duration-200 bg-white appearance-none"
              {...register("St_Slope", { required: true })}
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ec4899'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 1rem center",
                backgroundSize: "1.5em 1.5em",
              }}
            >
              <option value="">Select ST Slope</option>
              <option value="Up">Up</option>
              <option value="Flat">Flat</option>
              <option value="Down">Down</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-gray-700">Old Peak</label>
            <input
              type="number"
              step={0.1}
              className="w-full px-4 py-3 rounded-2xl border-2 border-pink-100 focus:border-pink-400 focus:outline-none transition-colors duration-200"
              placeholder="Enter Old Peak value"
              {...register("OldPeak", {
                required: true,
                valueAsNumber: true,
                min: 5,
                max: 10,
              })}
            />
          </div>
        </div>

        <div className="mt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-medium py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex justify-center items-center relative overflow-hidden group"
          >
            <span className="absolute right-0 w-12 h-full bg-white opacity-10 transform -skew-x-12 transition-transform duration-700 ease-in-out group-hover:translate-x-20"></span>
            {loading ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </div>
            ) : (
              <div className="flex items-center">
                Analyze Heart Health
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            )}
          </button>
        </div>
      </form>

      <ResultModal isOpen={showModal} onClose={closeModal} result={result} error={error} />
    </div>
  )
}

export default MlForm
