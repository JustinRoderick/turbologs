import { BarChart, Check, CloudLightning, Gauge, Settings2, Trophy, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";

export function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 dark:bg-gray-950 font-sans selection:bg-red-500/30 selection:text-red-900 dark:selection:text-red-100">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-6 z-50 w-[90%] max-w-5xl rounded-full border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 shadow-lg shadow-black/5 dark:shadow-red-900/10 backdrop-blur-md px-6 py-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="bg-red-600 p-2 rounded-full inline-flex items-center justify-center">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-bold text-lg tracking-tight uppercase text-gray-900 dark:text-gray-100">
            Turbologs
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-gray-600 dark:text-gray-300">
          <a
            href="#features"
            className="hover:text-red-600 dark:hover:text-red-500 transition-colors"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="hover:text-red-600 dark:hover:text-red-500 transition-colors"
          >
            Pricing
          </a>
          <a href="#" className="hover:text-red-600 dark:hover:text-red-500 transition-colors">
            Community
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="rounded-full hidden sm:inline-flex px-5 font-semibold tracking-wide"
            asChild
          >
            <Link to="/">Login</Link>
          </Button>
          <Button
            className="rounded-full px-5 bg-red-600 hover:bg-red-700 text-white font-semibold tracking-wide shadow-md shadow-red-600/20"
            asChild
          >
            <Link to="/">Get Started</Link>
          </Button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="w-full flex flex-col items-center justify-center pt-48 pb-24 px-4 sm:px-6 relative overflow-hidden">
        {/* Abstract Background Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-red-600/10 dark:bg-red-600/20 blur-[100px] rounded-full point-events-none" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-blue-600/5 dark:bg-blue-600/10 blur-[100px] rounded-full point-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Badge
              variant="outline"
              className="rounded-full border-red-500/30 text-red-700 dark:text-red-400 bg-red-500/10 px-4 py-1.5 font-medium mb-6 backdrop-blur-sm"
            >
              <Zap className="w-3.5 h-3.5 mr-2 inline-block" />
              The Data Platform for Drag Racers
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter text-gray-900 dark:text-white uppercase leading-[1.1]"
          >
            Dominate the Strip. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">
              Master Your Data.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto tracking-normal font-medium"
          >
            Stop guessing. Start winning. Turbologs is the ultimate all-in-one data platform that
            collects, analyzes, and visualizes your drag racing data to perfect your next ET.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Button
              size="lg"
              className="rounded-full px-8 py-6 text-lg bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/30 font-bold uppercase tracking-wider"
              asChild
            >
              <Link to="/">Start Logging For Free</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 py-6 text-lg font-bold uppercase tracking-wider bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-gray-300 dark:border-gray-700"
              asChild
            >
              <Link to="/">View Demo</Link>
            </Button>
          </motion.div>
        </div>

        {/* Dashboard Preview Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
          className="mt-24 w-full max-w-5xl rounded-2xl md:rounded-[2rem] border border-gray-200/50 dark:border-gray-800/80 bg-white/30 dark:bg-gray-900/40 backdrop-blur-xl p-2 md:p-4 shadow-2xl shadow-gray-200/50 dark:shadow-black/50 overflow-hidden relative"
        >
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
          <div className="rounded-xl md:rounded-[1.5rem] bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 shadow-inner w-full aspect-[16/9] flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.1)_0,transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="flex flex-col items-center opacity-50 dark:opacity-30">
              <LineChartIcon className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 text-gray-400 dark:text-gray-600 mb-4" />
              <span className="text-xl md:text-2xl font-bold font-mono tracking-widest text-gray-500 dark:text-gray-500 uppercase">
                Dashboard Preview
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full max-w-6xl mx-auto py-24 px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter uppercase mb-4">
            Built for <span className="text-red-600">Speed</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Everything you need to dial in your setup, all in one robust platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<BarChart className="w-6 h-6 text-red-500" />}
            title="Run Logging"
            description="Log every pass with incredible detail. Instantly access timeslips, track conditions, and vehicle increments."
            delay={0.1}
          />
          <FeatureCard
            icon={<CloudLightning className="w-6 h-6 text-red-500" />}
            title="Weather Tracking"
            description="Automatically pull DA, temperature, humidity, and wind data for every run. Know exactly how the air affected your ET."
            delay={0.2}
          />
          <FeatureCard
            icon={<Settings2 className="w-6 h-6 text-red-500" />}
            title="Setup Management"
            description="Keep track of tire pressure, suspension changes, gearing, and tune-ups. See what works and what doesn't."
            delay={0.3}
          />
          <FeatureCard
            icon={<Gauge className="w-6 h-6 text-red-500" />}
            title="Data Analytics"
            description="Compare runs side-by-side with beautiful charts. Identify trends and make data-driven decisions in the staging lanes."
            delay={0.4}
          />
          <FeatureCard
            icon={<Trophy className="w-6 h-6 text-red-500" />}
            title="Maintenance Log"
            description="Never wonder when you last changed the oil or checked the valves. Track all maintenance tied to run counts."
            delay={0.5}
          />
          <FeatureCard
            icon={<BoltIcon className="w-6 h-6 text-red-500" />}
            title="Predictive ET"
            description="Use your historical run data and current weather conditions to let our algorithm predict your dial-in."
            delay={0.6}
          />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full max-w-5xl mx-auto py-24 px-4 sm:px-6 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter uppercase mb-4">
            Simple <span className="text-red-600">Pricing</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose the plan that fits your racing program.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <Card className="h-full bg-white dark:bg-gray-900 shadow-xl border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-bold uppercase tracking-tight">
                  Sportsman
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Perfect for weekend warriors getting started with data.
                </CardDescription>
                <div className="mt-4 flex items-baseline text-5xl font-extrabold tracking-tighter">
                  $0
                  <span className="ml-1 text-xl font-medium text-gray-500">/mo</span>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                <ul className="space-y-4">
                  {[
                    "Up to 50 Runs Logged",
                    "Basic Weather Data",
                    "1 Vehicle Profile",
                    "Timeslip Entry",
                    "Community Access",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-1">
                        <Check className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-8 pt-0 mt-auto">
                <Button
                  className="w-full rounded-2xl py-6 text-lg font-bold uppercase tracking-wider bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:hover:bg-white dark:text-gray-900"
                  asChild
                >
                  <Link to="/">Start Free</Link>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-full bg-white dark:bg-[#0a0a0a] shadow-2xl shadow-red-900/10 border-red-500/50 dark:border-red-500/30 rounded-3xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
              <div className="absolute top-0 inset-x-0 h-1 bg-red-600" />
              <Badge className="absolute top-6 right-8 bg-red-600 hover:bg-red-600 text-white uppercase font-bold tracking-wider px-3 py-1">
                Top Fuel
              </Badge>

              <CardHeader className="p-8 pb-4 relative z-10">
                <CardTitle className="text-2xl font-bold uppercase tracking-tight text-gray-900 dark:text-white">
                  Pro Racer
                </CardTitle>
                <CardDescription className="text-base mt-2 dark:text-gray-400">
                  For serious competitors who need every advantage.
                </CardDescription>
                <div className="mt-4 flex items-baseline text-5xl font-extrabold tracking-tighter text-gray-900 dark:text-white">
                  $15
                  <span className="ml-1 text-xl font-medium text-gray-500">/mo</span>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-4 relative z-10">
                <ul className="space-y-4">
                  {[
                    "Unlimited Runs Logged",
                    "Advanced Weather API Integration",
                    "Unlimited Vehicle Profiles",
                    "Advanced Analytics & Charts",
                    "Predictive ET Algorithm",
                    "Maintenance Tracking",
                    "Priority Support",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-1">
                        <Check className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-8 pt-0 mt-auto relative z-10">
                <Button
                  className="w-full rounded-2xl py-6 text-lg font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25"
                  asChild
                >
                  <Link to="/">Go Pro Today</Link>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] py-12 px-4 sm:px-6 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-red-600 fill-red-600" />
            <span className="font-bold text-xl tracking-tight uppercase">Turbologs</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">
            © {new Date().getFullYear()} Turbologs. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm font-medium text-gray-500 dark:text-gray-400">
            <a href="#" className="hover:text-red-600 dark:hover:text-red-500 transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-red-600 dark:hover:text-red-500 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-red-600 dark:hover:text-red-500 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper Components
function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card className="h-full bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl hover:shadow-red-900/5 dark:hover:border-gray-700 transition-all duration-300 rounded-3xl overflow-hidden group">
        <CardHeader className="pb-2">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center mb-4 group-hover:bg-red-100 dark:group-hover:bg-red-900/50 transition-colors">
            {icon}
          </div>
          <CardTitle className="text-xl font-bold uppercase tracking-tight">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Placeholder Icons for design
function LineChartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

function BoltIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}
