"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Download } from "lucide-react"

export default function AuditPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#001623" }}>
            Audit Trail
          </h1>
          <p className="text-gray-600 mt-2">Track all system activities and maintain compliance.</p>
        </div>
        <Button className="text-white" style={{ backgroundColor: "#042841" }}>
          <Download className="w-4 h-4 mr-2" />
          Export Audit Log
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center" style={{ color: "#001623" }}>
            <Shield className="w-5 h-5 mr-2" />
            Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs yet</h3>
            <p className="text-gray-500 mb-4">System activities will be tracked and displayed here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
