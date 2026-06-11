import React from "react";

export default function Loader() {
    return (
        <div id="preloader" className="fixed inset-0 flex items-center justify-center bg-white z-50" >
            <div className="bd-loader-inner" >
                <div className="bd-loader flex gap-1" >
                    <span className="bd-loader-item w-2 h-2 bg-black rounded-full animate-bounce" > </span>
                    < span className="bd-loader-item w-2 h-2 bg-black rounded-full animate-bounce delay-75" > </span>
                    < span className="bd-loader-item w-2 h-2 bg-black rounded-full animate-bounce delay-150" > </span>
                    < span className="bd-loader-item w-2 h-2 bg-black rounded-full animate-bounce delay-225" > </span>
                    < span className="bd-loader-item w-2 h-2 bg-black rounded-full animate-bounce delay-300" > </span>
                    < span className="bd-loader-item w-2 h-2 bg-black rounded-full animate-bounce delay-375" > </span>
                    < span className="bd-loader-item w-2 h-2 bg-black rounded-full animate-bounce delay-450" > </span>
                    < span className="bd-loader-item w-2 h-2 bg-black rounded-full animate-bounce delay-525" > </span>
                </div>
            </div>
        </div>
    );
}