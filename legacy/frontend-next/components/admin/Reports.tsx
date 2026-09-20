'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Calendar as CalendarIcon,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Bus,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Clock
} from 'lucide-react'

// Mock data
const dailyRevenue = [
  { date: '01/01', revenue: 12000, bookings: 45 },
  { date: '01/02', revenue: 15000, bookings: 52 },
  { date: '01/03', revenue: 18000, bookings: 61 },
  { date: '01/04', revenue: 14000, bookings: 48 },
  { date: '01/05', revenue: 22000, bookings: 75 },
  { date: '01/06', revenue: 28000, bookings: 92 },
  { date: '01/07', revenue: 25000, bookings: 85 },
  { date: '01/08', revenue: 19000, bookings: 64 },
  { date: '01/09', revenue: 21000, bookings: 70 },
  { date: '01/10', revenue: 24000, bookings: 80 },
  { date: '01/11', revenue: 26000, bookings: 86 },
  { date: '01/12', revenue: 23000, bookings: 76 },
  { date: '01/13', revenue: 27000, bookings: 88 },
  { date: '01/14', revenue: 29000, bookings: 95 },
]

const weeklyRevenue = [
  { date: 'Week 1', revenue: 85000, bookings: 285 },
  { date: 'Week 2', revenue: 92000, bookings: 310 },
  { date: 'Week 3', revenue: 78000, bookings: 265 },
  { date: 'Week 4', revenue: 105000, bookings: 355 },
]

const monthlyRevenue = [
  { date: 'Oct', revenue: 280000, bookings: 950 },
  { date: 'Nov', revenue: 320000, bookings: 1080 },
  { date: 'Dec', revenue: 450000, bookings: 1520 },
  { date: 'Jan', revenue: 360000, bookings: 1215 },
]

const utilizationData = [
  { vehicle: 'Volvo 9400XL', utilization: 85, trips: 120 },
  { vehicle: 'Scania Metrolink', utilization: 78, trips: 98 },
  { vehicle: 'Toyota Coaster', utilization: 92, trips: 145 },
  { vehicle: 'Force Traveller', utilization: 65, trips: 78 },
  { vehicle: 'Mercedes Benz', utilization: 88, trips: 110 },
]

const routeData = [
  { route: 'Chennai → Bangalore', bookings: 450, revenue: 135000, percentage: 35 },
  { route: 'Bangalore → Hyderabad', bookings: 320, revenue: 96000, percentage: 25 },
  { route: 'Hyderabad → Chennai', bookings: 280, revenue: 84000, percentage: 22 },
  { route: 'Chennai → Coimbatore', bookings: 180, revenue: 54000, percentage: 14 },
  { route: 'Bangalore → Mumbai', bookings: 95, revenue: 28500, percentage: 4 },
]

const demographicData = [
  { age: '18-25', count: 320, percentage: 25 },
  { age: '26-35', count: 450, percentage: 35 },
  { age: '36-45', count: 280, percentage: 22 },
  { age: '46-55', count: 160, percentage: 12 },
  { age: '55+', count: 75, percentage: 6 },
]

const utilizationHeatmapData = [
  { vehicle: 'Volvo', mon: 85, tue: 90, wed: 78, thu: 82, fri: 95, sat: 88, sun: 80 },
  { vehicle: 'Scania', mon: 75, tue: 80, wed: 72, thu: 78, fri: 85, sat: 82, sun: 75 },
  { vehicle: 'Toyota', mon: 90, tue: 88, wed: 85, thu: 90, fri: 92, sat: 95, sun: 85 },
  { vehicle: 'Force', mon: 70, tue: 72, wed: 68, thu: 75, fri: 80, sat: 78, sun: 70 },
]

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

type ReportPeriod = 'daily' | 'weekly' | 'monthly'
type ReportType = 'revenue' | 'utilization' | 'routes' | 'demographics'

export function Reports() {
  const [period, setPeriod] = useState<ReportPeriod>('daily')
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [activeReport, setActiveReport] = useState<ReportType>('revenue')

  const getRevenueData = () => {
    switch (period) {
      case 'daily':
        return dailyRevenue
      case 'weekly':
        return weeklyRevenue
      case 'monthly':
        return monthlyRevenue
    }
  }

  const calculateTotalRevenue = () => {
    const data = getRevenueData()
    return data.reduce((sum, item) => sum + item.revenue, 0)
  }

  const calculateTotalBookings = () => {
    const data = getRevenueData()
    return data.reduce((sum, item) => sum + (item.bookings || 0), 0)
  }

  const calculateAverageUtilization = () => {
    return Math.round(
      utilizationData.reduce((sum, item) => sum + item.utilization, 0) / utilizationData.length
    )
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Exporting report as ${format}`)
    // Implement export logic
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-500">Track performance and generate insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => handleExport('csv')}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => handleExport('pdf')}>
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
                        </>
                      ) : (
                        formatDate(dateRange.from)
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to,
                    }}
                    onSelect={(range: any) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="w-full md:w-[180px]">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Period</label>
              <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="gap-2">
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(calculateTotalRevenue())}
                </p>
                <div className="flex items-center mt-2 text-sm">
                  <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-green-600">+12%</span>
                  <span className="text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{calculateTotalBookings()}</p>
                <div className="flex items-center mt-2 text-sm">
                  <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-green-600">+8%</span>
                  <span className="text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Utilization</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{calculateAverageUtilization()}%</p>
                <div className="flex items-center mt-2 text-sm">
                  <ArrowDownRight className="w-4 h-4 text-red-600 mr-1" />
                  <span className="text-red-600">-3%</span>
                  <span className="text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <Bus className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Trip Duration</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">6h 30m</p>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-gray-500">Across all routes</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeReport === 'revenue' ? 'default' : 'ghost'}
          onClick={() => setActiveReport('revenue')}
          className="rounded-b-none"
        >
          Revenue Trends
        </Button>
        <Button
          variant={activeReport === 'utilization' ? 'default' : 'ghost'}
          onClick={() => setActiveReport('utilization')}
          className="rounded-b-none"
        >
          Vehicle Utilization
        </Button>
        <Button
          variant={activeReport === 'routes' ? 'default' : 'ghost'}
          onClick={() => setActiveReport('routes')}
          className="rounded-b-none"
        >
          Popular Routes
        </Button>
        <Button
          variant={activeReport === 'demographics' ? 'default' : 'ghost'}
          onClick={() => setActiveReport('demographics')}
          className="rounded-b-none"
        >
          Demographics
        </Button>
      </div>

      {/* Revenue Chart */}
      {activeReport === 'revenue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={getRevenueData()}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey={period === 'daily' ? 'date' : period === 'weekly' ? 'week' : 'month'}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getRevenueData().slice(-5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.date}
                      </p>
                      {item.bookings && (
                        <p className="text-xs text-gray-500">{item.bookings} bookings</p>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(item.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Utilization Chart */}
      {activeReport === 'utilization' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={utilizationData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="vehicle" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="utilization" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Utilization Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {utilizationHeatmapData.map((row) => (
                  <div key={row.vehicle} className="flex items-center gap-2">
                    <span className="w-20 text-sm font-medium">{row.vehicle}</span>
                    <div className="flex-1 flex gap-1">
                      {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => {
                        const value = row[day as keyof typeof row] as number
                        const getColor = () => {
                          if (value >= 90) return 'bg-green-500'
                          if (value >= 80) return 'bg-green-400'
                          if (value >= 70) return 'bg-yellow-400'
                          if (value >= 60) return 'bg-orange-400'
                          return 'bg-red-400'
                        }
                        return (
                          <div
                            key={day}
                            className={`flex-1 h-8 rounded ${getColor()} flex items-center justify-center`}
                            title={`${day.charAt(0).toUpperCase() + day.slice(1)}: ${value}%`}
                          >
                            <span className="text-xs font-medium text-white">{value}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                <span>Low utilization</span>
                <div className="flex gap-1">
                  <div className="w-8 h-3 bg-red-400 rounded" />
                  <div className="w-8 h-3 bg-orange-400 rounded" />
                  <div className="w-8 h-3 bg-yellow-400 rounded" />
                  <div className="w-8 h-3 bg-green-400 rounded" />
                  <div className="w-8 h-3 bg-green-500 rounded" />
                </div>
                <span>High utilization</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Routes Chart */}
      {activeReport === 'routes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Popular Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={routeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.route}: ${entry.percentage}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="bookings"
                  >
                    {routeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Route Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {routeData.map((route) => (
                  <div key={route.route} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{route.route}</span>
                      </div>
                      <Badge variant="secondary">{route.percentage}%</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Bookings: </span>
                        <span className="font-medium">{route.bookings}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Revenue: </span>
                        <span className="font-medium">{formatCurrency(route.revenue)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${route.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Demographics Chart */}
      {activeReport === 'demographics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Age Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={demographicData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} />
                  <YAxis dataKey="age" type="category" axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demographic Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {demographicData.map((demo) => (
                  <div key={demo.age} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-16 text-sm font-medium">{demo.age}</div>
                      <div className="flex-1 w-40 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${demo.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{demo.count}</p>
                      <p className="text-xs text-gray-500">{demo.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Average Age</p>
                    <p className="text-xl font-bold">34 years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Largest Segment</p>
                    <p className="text-xl font-bold">26-35 (35%)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
