import React, { useState, useCallback, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import Confetti from 'react-confetti';
import useSound from 'use-sound';
import { log } from 'tone/build/esm/core/util/Debug';


const ErrorMessage = ({ message }) => (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
        <p className="font-bold">Xatolik</p>
        <p>{message}</p>
    </div>
);

const SuccessDialog = ({ adminName }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [play] = useSound('https://cdn.pixabay.com/audio/2023/08/07/audio_1b7b4e9f9e.mp3', { volume: 0.5 });

    useEffect(() => {
        play(); // Ovozli effektni boshlash
        const timer = setTimeout(() => {
            setIsVisible(false); // 7 soniyadan keyin yopiladi
        }, 7000);
        return () => clearTimeout(timer);
    }, [play]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-opacity-90 flex items-start justify-center z-50 transition-opacity duration-700 animate-slide-down">
            <style>
                {`
                    .checkmark__circle {
                        stroke-dasharray: 166;
                        stroke-dashoffset: 166;
                        stroke-width: 3;
                        stroke-miterlimit: 10;
                        stroke: #4ade80;
                        fill: none;
                        animation: stroke 1s cubic-bezier(0.65, 0, 0.45, 1) forwards;
                    }
                    .checkmark__check {
                        transform-origin: 50% 50%;
                        stroke-dasharray: 48;
                        stroke-dashoffset: 48;
                        stroke-width: 4;
                        stroke-linecap: round;
                        stroke: #4ade80;
                        fill: none;
                        animation: stroke 0.5s cubic-bezier(0.65, 0, 0.45, 1) 1.2s forwards;
                    }
                    @keyframes stroke {
                        100% {
                            stroke-dashoffset: 0;
                        }
                    }
                    @keyframes slide-down {
                        0% {
                            transform: translateY(-100%);
                            opacity: 0;
                        }
                        100% {
                            transform: translateY(0);
                            opacity: 1;
                        }
                    }
                    .animate-slide-down {
                        animation: slide-down 1s ease-out forwards;
                    }
                    .hover-scale {
                        transition: transform 0.3s ease;
                    }
                    .hover-scale:hover {
                        transform: scale(1.05);
                    }
                `}
            </style>
            <Confetti
                width={window.innerWidth}
                height={window.innerHeight}
                recycle={false}
                numberOfPieces={200}
                tweenDuration={5000}
            />
            <div className="bg-white rounded-2xl shadow-2xl p-10 sm:p-16 text-center w-full h-full flex flex-col items-center justify-center relative gap-y-5">
                <button
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-3xl"
                    onClick={() => setIsVisible(false)}
                >
                    ×
                </button>
                <svg className="checkmark w-40 h-40 mx-auto mb-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                    <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                </svg>
                <h2 className="text-5xl md:text-7xl font-extrabold text-gray-800 mb-6">Ajoyib, {adminName}!</h2>
                <p className="text-2xl md:text-4xl text-gray-600 mb-8 font-semibold px-64 leading-loose whitespace-normal">
                    Siz jamoamizning eng ishonchli va mehnatkash a'zosisiz. Har kuni  ishga mehr bilan yondashasiz  — barakalla! 
                </p>
                <button
                    className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-xl font-semibold hover-scale"
                    onClick={() => setIsVisible(false)}
                >
                    Davom etish
                </button>
            </div>
        </div>
    );
};


const LoginForm = ({ onLoginSuccess }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const platformName = "LONDON EDUCATION";

    const [adminNameFor, setAdminNameFor] = useState("");

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const data = await apiRequest('/auth/admin', 'POST', { phone, password });

            setAdminNameFor(data.name);
            
            if (data && data.accessToken) {
                setLoginSuccess(true);
                
                setTimeout(() => {
                    if (onLoginSuccess && typeof onLoginSuccess === 'function') {
                        onLoginSuccess(data.accessToken);
                    } else {
                        console.warn("onLoginSuccess function is not provided.");
                    }
                }, 15000);

            } else {
                throw new Error('Login muvaffaqiyatsiz: Token olinmadi.');
            }
        } catch (err) {
            setError(err.message || 'Login amalga oshmadi.');
            setLoading(false); 
        }
    }, [phone, password, onLoginSuccess]);

    console.log("ADMINLAST", adminNameFor);
    

    return (
        <>
            {/* Conditionally render the success dialog */}
            {loginSuccess && <SuccessDialog adminName={adminNameFor} />}

            <div className="flex items-stretch justify-center min-h-screen bg-gray-50 text-gray-900">
                {/* Left Side: The Form */}
                <div className="w-full md:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
                    <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
                        {/* Platform Name */}
                        <div className="text-center mb-6">
                            <h1 className="text-3xl font-bold text-indigo-600">{platformName}</h1>
                        </div>

                        <h2 className="text-2xl font-bold mb-8 text-center text-gray-700">Tizimga kirish</h2>
                        
                        {error && <ErrorMessage message={error} />}
                        
                        <form onSubmit={handleSubmit} noValidate>
                            {/* Phone Number Field */}
                            <div className="mb-5">
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="phone">
                                    Telefon raqami
                                </label>
                                <input
                                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 ease-in-out"
                                    id="phone"
                                    type="tel"
                                    placeholder="+998 90 123 45 67"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    aria-required="true"
                                />
                            </div>

                            {/* Password Field */}
                            <div className="mb-8">
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
                                    Parol
                                </label>
                                <input
                                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 ease-in-out"
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    aria-required="true"
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="flex items-center justify-between">
                                <button
                                    className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
                                    type="submit"
                                    disabled={loading}
                                    aria-busy={loading}
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Kirilmoqda...
                                        </div>
                                    ) : (
                                        'Kirish'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Side: The Animation */}
                <div className="hidden md:flex w-1/2 bg-indigo-600 items-center justify-center relative overflow-hidden">
                    <style>
                        {`
                        @keyframes blob {
                            0% { transform: translate(0px, 0px) scale(1); }
                            33% { transform: translate(40px, -60px) scale(1.15); }
                            66% { transform: translate(-30px, 30px) scale(0.9); }
                            100% { transform: translate(0px, 0px) scale(1); }
                        }
                        `}
                    </style>
                    {/* Animated Blobs */}
                    <div className="absolute bg-blue-400 rounded-full w-80 h-80 top-20 -left-20 opacity-50" style={{animation: 'blob 8s infinite ease-in-out'}}></div>
                    <div className="absolute bg-purple-400 rounded-full w-72 h-72 bottom-10 -right-10 opacity-50" style={{animation: 'blob 10s infinite ease-in-out', animationDelay: '3s'}}></div>
                    <div className="absolute bg-blue-300 rounded-full w-48 h-48 bottom-1/3 left-1/4 opacity-50" style={{animation: 'blob 12s infinite ease-in-out', animationDelay: '1.5s'}}></div>
                    
                    {/* Content over the animation */}
                    <div className="z-10 text-center text-white p-8">
                        <h2 className="text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
                            London Education Platformasiga Xush Kelibsiz!
                        </h2>
                        <p className="text-lg text-indigo-100">
                            Bilimlaringizni biz bilan keyingi bosqichga olib chiqing.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginForm;
