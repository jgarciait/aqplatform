"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const carouselItems = [
    {
      title: "Build powerful forms",
      description: "Create custom forms with our drag and drop builder - no coding required",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-vSlXzrGADRY8JRZdC2i9Q4VNxSBVsV.png",
      isLocal: true,
    },
    {
      title: "Organize workspaces",
      description: "Manage multiple projects and teams with organized workspaces and collaboration tools",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-4S96JHaukHOuVVjaOzabN5pdLk0s4m.png",
      isLocal: true,
    },
    {
      title: "Custom data tables",
      description: "Build and customize data tables with advanced filtering, sorting, and status tracking",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-joMBM5wrYZsUstiCgRiOgNWD5B0oLm.png",
      isLocal: true,
    },
    {
      title: "Manage documents",
      description: "Store, organize, and collaborate on documents in one secure place",
      image:
        "https://images.pexels.com/photos/590020/pexels-photo-590020.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    },
  ]

  return (
    <div className="flex min-h-screen">
      {/* Left side - AQ Platform themed area with carousel */}
      <div className="hidden md:flex md:w-1/2 aq-bg text-white p-8 flex-col justify-center items-center relative overflow-hidden">
        {/* SVG Network Pattern */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          viewBox="0 0 800 600"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity="1" />
              <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Network lines */}
          <g stroke="#00d4ff" strokeWidth="1" opacity="0.6">
            <line x1="100" y1="150" x2="200" y2="100" />
            <line x1="200" y1="100" x2="350" y2="180" />
            <line x1="350" y1="180" x2="500" y2="120" />
            <line x1="500" y1="120" x2="650" y2="200" />
            <line x1="150" y1="300" x2="300" y2="250" />
            <line x1="300" y1="250" x2="450" y2="320" />
            <line x1="450" y1="320" x2="600" y2="280" />
            <line x1="200" y1="450" x2="400" y2="400" />
            <line x1="400" y1="400" x2="550" y2="480" />
            <line x1="100" y1="150" x2="150" y2="300" />
            <line x1="350" y1="180" x2="300" y2="250" />
            <line x1="500" y1="120" x2="450" y2="320" />
            <line x1="300" y1="250" x2="400" y2="400" />
          </g>

          {/* Network nodes */}
          <g>
            <circle cx="100" cy="150" r="4" fill="url(#nodeGlow)" />
            <circle cx="200" cy="100" r="3" fill="url(#nodeGlow)" />
            <circle cx="350" cy="180" r="5" fill="url(#nodeGlow)" />
            <circle cx="500" cy="120" r="3" fill="url(#nodeGlow)" />
            <circle cx="650" cy="200" r="4" fill="url(#nodeGlow)" />
            <circle cx="150" cy="300" r="3" fill="url(#nodeGlow)" />
            <circle cx="300" cy="250" r="4" fill="url(#nodeGlow)" />
            <circle cx="450" cy="320" r="3" fill="url(#nodeGlow)" />
            <circle cx="600" cy="280" r="5" fill="url(#nodeGlow)" />
            <circle cx="200" cy="450" r="3" fill="url(#nodeGlow)" />
            <circle cx="400" cy="400" r="4" fill="url(#nodeGlow)" />
            <circle cx="550" cy="480" r="3" fill="url(#nodeGlow)" />
          </g>

          {/* Animated floating particles */}
          <g opacity="0.8">
            <circle cx="120" cy="80" r="1" fill="#00d4ff">
              <animate attributeName="cy" values="80;90;80" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="380" cy="50" r="1" fill="#00d4ff">
              <animate attributeName="cy" values="50;60;50" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="580" cy="350" r="1" fill="#00d4ff">
              <animate attributeName="cy" values="350;360;350" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="250" cy="520" r="1" fill="#00d4ff">
              <animate attributeName="cy" values="520;530;520" dur="3.5s" repeatCount="indefinite" />
            </circle>
          </g>
        </svg>

        <div className="w-full max-w-md relative z-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-white">AQPlatform</h1>
            <p className="text-white opacity-90">
              Your all-in-one solution for E-Forms, Workflows, and Document Management
            </p>
          </div>

          <Carousel className="w-full">
            <CarouselContent>
              {carouselItems.map((item, index) => (
                <CarouselItem key={index}>
                  <Card className="bg-transparent border-0 shadow-none">
                    <CardContent className="p-0">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-white/20">
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            style={item.isLocal ? { backgroundColor: "transparent" } : {}}
                          />
                          {!item.isLocal && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          )}
                        </div>
                        <div className="text-center">
                          <h3 className="text-xl font-bold mb-2 text-white">{item.title}</h3>
                          <p className="text-white opacity-80">{item.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center mt-4 space-x-2">
              <CarouselPrevious className="relative inset-0 translate-x-0 translate-y-0 bg-white/10 hover:bg-white/20 text-white border-white/20" />
              <CarouselNext className="relative inset-0 translate-x-0 translate-y-0 bg-white/10 hover:bg-white/20 text-white border-white/20" />
            </div>
          </Carousel>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ color: "#001623" }}>
              Log in
            </h2>
            <p className="text-gray-600">Welcome to AQPlatform, please enter your credentials to access your account</p>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-gray-300 focus:border-aq-medium focus:ring-aq-medium"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm hover:underline" style={{ color: "#042841" }}>
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-gray-300 focus:border-aq-medium focus:ring-aq-medium"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label htmlFor="remember" className="text-sm font-normal">
                Remember me
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#083e5c] hover:bg-[#0a4a6e] text-white transition-colors duration-200"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Log in"}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/signup" className="font-medium hover:underline" style={{ color: "#042841" }}>
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
