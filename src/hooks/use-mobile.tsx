import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Set initial state
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    // Function to update state based on window size
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Set up event listener for window resize
    window.addEventListener("resize", handleResize)
    
    // Clean up event listener on component unmount
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return !!isMobile
}
