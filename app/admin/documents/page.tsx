"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FolderOpen, Upload } from "lucide-react"

export default function DocumentsPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#001623" }}>
            Document Management
          </h1>
          <p className="text-gray-600 mt-2">Store, organize, and manage your documents securely.</p>
        </div>
        <Button className="text-white" style={{ backgroundColor: "#042841" }}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center" style={{ color: "#001623" }}>
            <FolderOpen className="w-5 h-5 mr-2" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-4">Upload your first document to get started.</p>
            <Button className="text-white" style={{ backgroundColor: "#042841" }}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Your First Document
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
