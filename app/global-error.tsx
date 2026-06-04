'use client'; 
 
import { ThemeProvider } from '@/components/theme-provider'; 
 
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) { 
  return ( 
    <html> 
      <body> 
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem> 
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800"> 
            <div className="text-center"> 
              <h2 className="text-2xl font-bold text-white mb-4">Something went wrong!</h2> 
              <button 
                onClick={reset} 
                className="px-6 py-3 bg-purple-600 rounded-lg text-white" 
              > 
                Try again 
              </button> 
            </div> 
          </div> 
        </ThemeProvider> 
      </body> 
    </html> 
  ); 
} 
