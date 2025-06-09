"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Download } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#001623" }}>
            Reports
          </h1>
          <p className="text-gray-600 mt-2">Analyze your data with comprehensive reports and insights.</p>
        </div>
        <Button className="text-white" style={{ backgroundColor: "#042841" }}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center" style={{ color: "#001623" }}>
            <BarChart3 className="w-5 h-5 mr-2" />
            Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
            <p className="text-gray-500 mb-4">Reports will appear here once you have data to analyze.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
