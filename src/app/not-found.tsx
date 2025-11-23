"use client"; 

import { useRouter } from "next/navigation"; 

import { PiSmileySadLight } from "react-icons/pi"; 

export default function NotFound() {
    const router = useRouter(); 
    
    return (
        <div className="flex flex-col items-center justify-center min-h-[90vh] bg-gray-100">
            <PiSmileySadLight className="text-[500px]" /> 
            <h1 className="text-4xl font-bold mb-4">Page not found.</h1>
            <p className="text-lg text-gray-600">Sorry, the page you are looking for does not exist.</p>
            <div className="cursor-pointer mt-6 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors" onClick={() => router.back()}>
                Go back
            </div>
        </div>
    ); 
}