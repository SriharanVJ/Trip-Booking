'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Bus,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Target,
  Zap,
  BarChart3
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { cn } from '@/lib/utils'

// Mock data with more realistic patterns
const revenueData = [
  { name: 'Mon', revenue: 12000, bookings: 12 },
  { name: 'Tue', revenue: 15000, bookings: 15 },
  { name: 'Wed', revenue: 18000, bookings: 18 },
  { name: 'Thu', revenue: 14000, bookings: 14 },
  { name: 'Fri', revenue: 22000, bookings: 22 },
  { name: 'Sat', revenue: 28000, bookings: 28 },
  { name: 'Sun', revenue: 25000, bookings: 25 },
]

const weeklyBookingsData = [
  { name: 'Week 1', bookings: 45, revenue: 45000 },
  { name: 'Week 2', bookings: 52, revenue: 52000 },
  { name: 'Week 3', bookings: 48, revenue: 48000 },
  { name: 'Week 4', bookings: 61, revenue: 61000 },
]

const vehicleTypeData = [
  { name: 'Bus', value: 45, color: '#3b82f6' },
  { name: 'Traveller', value: 30, color: '#10b981' },
  { name: 'Car', value: 15, color: '#f59e0b' },
  { name: 'Coach', value: 10, color: '#8b5cf6' },
]

const recentActivity = [
  { id: 1, action: 'New booking received', user: 'John Doe', time: '2 min ago', type: 'success', amount: 'Rs. 15,000' },
  { id: 2, action: 'Payment confirmed', user: 'Jane Smith', time: '5 min ago', type: 'success', amount: 'Rs. 22,000' },
  { id: 3, action: 'Booking cancelled', user: 'Mike Johnson', time: '15 min ago', type: 'warning', amount: 'Rs. 8,000' },
  { id: 4, action: 'New vehicle added', user: 'Admin', time: '1 hour ago', type: 'info', amount: null },
  { id: 5, action: 'Booking completed', user: 'Sarah Wilson', time: '2 hours ago', type: 'success', amount: 'Rs. 18,500' },
  { id: 6, action: 'Refund processed', user: 'Tom Brown', time: '3 hours ago', type: 'warning', amount: 'Rs. 5,000' },
]

const stats = [
  {
    title: "Today's Revenue",
    value: 'Rs. 45,200',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
    gradient: 'from-green-500 to-emerald-500',
    description: 'vs yesterday'
  },
  {
    title: 'Active Bookings',
    value: '24',
    change: '+8',
    trend: 'up',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    gradient: 'from-blue-500 to-cyan-500',
    description: 'in progress'
  },
  {
    title: 'Vehicle Utilization',
    value: '78%',
    change: '-3%',
    trend: 'down',
    icon: Bus,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    gradient: 'from-purple-500 to-pink-500',
    description: 'of total fleet'
  },
  {
    title: 'Pending Approvals',
    value: '8',
    change: '+2',
    trend: 'up',
    icon: Clock,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    gradient: 'from-orange-500 to-red-500',
    description: 'require attention'
  },
]

const quickActions = [
  { label: 'Add Vehicle', href: '/admin/vehicles?action=add', icon: Bus, color: 'from-blue-500 to-cyan-500' },
  { label: 'View Bookings', href: '/admin/bookings', icon: Users, color: 'from-green-500 to-emerald-500' },
  { label: 'Generate Report', href: '/admin/reports', icon: BarChart3, color: 'from-purple-500 to-pink-500' },
  { label: 'Approve Requests', href: '/admin/bookings?status=pending', icon: CheckCircle, color: 'from-orange-500 to-red-500' },
]

const topRoutes = [
  { route: 'Tirupur → Ooty', bookings: 45, revenue: 'Rs. 225,000', growth: '+15%' },
  { route: 'Coimbatore → Chennai', bookings: 38, revenue: 'Rs. 190,000', growth: '+22%' },
  { route: 'Tirupur → Kodaikanal', bookings: 32, revenue: 'Rs. 160,000', growth: '+18%' },
  { route: 'Madurai → Rameshwaram', bookings: 28, revenue: 'Rs. 140,000', growth: '+8%' },
]

export function DashboardStats() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Real-time insights and analytics</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Last 7 Days
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-primary to-accent">
            <Target className="w-4 h-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={stat.title} className="group hover:shadow-premium-lg transition-all duration-300 border-border/50 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </div>
                <div className={cn(
                  'p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300',
                  stat.bgColor
                )}>
                  <div className={cn(
                    'w-10 h-10 rounded-xl bg-gradient-to-r flex items-center justify-center',
                    stat.gradient
                  )}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600 mr-1" />
                )}
                <span className={cn(
                  'font-semibold',
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                )}>
                  {stat.change}
                </span>
                <span className="text-muted-foreground ml-1">from yesterday</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-border/50 hover:shadow-premium transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <Button
                  variant="outline"
                  className="w-full h-auto py-6 flex flex-col items-center gap-3 hover:bg-muted/50 border-2 group transition-all hover:-translate-y-1"
                >
                  <div className={cn(
                    'p-3 rounded-xl bg-gradient-to-r transition-transform group-hover:scale-110',
                    action.color
                  )}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-semibold">{action.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend - Spans 2 columns */}
        <Card className="lg:col-span-2 border-border/50 hover:shadow-premium transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Revenue Trend
            </CardTitle>
            <Badge className="bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
              +15.3% vs last week
            </Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRevenueLine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="stroke-muted" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'currentColor', className: 'text-muted-foreground text-xs' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'currentColor', className: 'text-muted-foreground text-xs' }}
                  tickFormatter={(value) => `Rs. ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                    padding: '12px'
                  }}
                  formatter={(value: any) => [`Rs. ${(Number(value) || 0).toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="url(#colorRevenueLine)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  animationBegin={0}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vehicle Types Distribution */}
        <Card className="border-border/50 hover:shadow-premium transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Bus className="w-5 h-5 text-purple-600" />
              Vehicle Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={vehicleTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1000}
                >
                  {vehicleTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {vehicleTypeData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Bookings Chart */}
      <Card className="border-border/50 hover:shadow-premium transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Weekly Bookings Performance
          </CardTitle>
          <Badge className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
            +28% vs last month
          </Badge>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyBookingsData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="stroke-muted" opacity={0.3} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'currentColor', className: 'text-muted-foreground text-xs' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'currentColor', className: 'text-muted-foreground text-xs' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                }}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              <Bar
                dataKey="bookings"
                fill="url(#barGradient)"
                radius={[8, 8, 0, 0]}
                animationBegin={0}
                animationDuration={1000}
              />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity & Top Routes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="border-border/50 hover:shadow-premium transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Recent Activity
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px]">
              <div className="space-y-2">
                {recentActivity.map((activity, index) => (
                  <div
                    key={activity.id}
                    className={cn(
                      'flex items-start gap-3 p-4 rounded-xl hover:bg-muted/50 transition-all duration-200 animate-fade-in-up',
                      index === 0 && 'bg-primary/5 border border-primary/10'
                    )}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className={cn(
                      'mt-0.5 p-2 rounded-lg',
                      activity.type === 'success' ? 'bg-green-100 dark:bg-green-950' :
                      activity.type === 'warning' ? 'bg-orange-100 dark:bg-orange-950' :
                      'bg-blue-100 dark:bg-blue-950'
                    )}>
                      {activity.type === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : activity.type === 'warning' ? (
                        <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">by {activity.user}</p>
                    </div>
                    <div className="text-right">
                      {activity.amount && (
                        <p className="text-sm font-semibold text-foreground">{activity.amount}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Top Routes */}
        <Card className="border-border/50 hover:shadow-premium transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Top Performing Routes
            </CardTitle>
            <Badge className="bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800">
              This Month
            </Badge>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px]">
              <div className="space-y-3">
                {topRoutes.map((route, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-bold text-primary">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {route.route}
                        </p>
                        <p className="text-xs text-muted-foreground">{route.bookings} bookings</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{route.revenue}</p>
                      <p className="text-xs text-green-600 font-medium">{route.growth}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
