'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from '@/components/icons'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      // TODO: Implement password reset
      console.log('Password reset requested for:', email)
      setIsSubmitted(true)
    } catch (error) {
      console.error('Password reset error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container relative flex-col items-center justify-center grid min-h-screen lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Icons.logo className="mr-2 h-6 w-6" />
          Infinite Canvas
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Security is not just a feature, it's our priority. Reset your password safely and get back to creating.&rdquo;
            </p>
            <footer className="text-sm">Security Team</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center">
                <Link
                  href="/sign-in"
                  className="text-sm text-muted-foreground hover:text-primary mr-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <CardTitle className="text-2xl">Reset password</CardTitle>
              </div>
              <CardDescription>
                {!isSubmitted 
                  ? "Enter your email address and we'll send you a link to reset your password"
                  : "Check your email for the reset link"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isSubmitted ? (
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4">
                    <div className="grid gap-1">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        placeholder="name@example.com"
                        type="email"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect="off"
                        disabled={isLoading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                          Please wait
                        </>
                      ) : (
                        "Send reset link"
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    We've sent a password reset link to <strong>{email}</strong>. 
                    Click the link in the email to reset your password.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the email? Check your spam folder or{' '}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-normal"
                      onClick={() => setIsSubmitted(false)}
                    >
                      try again
                    </Button>
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="text-sm text-muted-foreground">
                Remember your password?{' '}
                <Link 
                  href="/sign-in" 
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

