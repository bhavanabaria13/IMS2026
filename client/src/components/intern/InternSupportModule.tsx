import React from "react";
import { LifeBuoy } from "lucide-react";

export default function InternSupportModule() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-card border rounded-2xl shadow-sm p-8 text-center max-w-md w-full">

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
            <LifeBuoy className="h-6 w-6" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold mb-2">
          Community Support
        </h2>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-6">
          Need help or want to connect with the community?  
          Join our Discord server for support and discussions.
        </p>

        {/* Button */}
        <a
          href="https://discord.gg/RQWRmpQeUW"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 transition-all"
        >
          Join Discord
        </a>

      </div>
    </div>
  );
}
