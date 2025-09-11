import React, { useState } from 'react'
import { set, unset } from 'sanity'

interface CsvUploadInputProps {
  value?: any[]
  onChange: (value: any[]) => void
}

export function CsvUploadInput({ value = [], onChange }: CsvUploadInputProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parseCsv = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim())
    const websites: any[] = []
    
    // Skip header row if it exists
    const dataLines = lines.slice(1)
    
    dataLines.forEach((line, index) => {
      const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''))
      
      if (columns.length >= 2) {
        websites.push({
          _key: `website_${Date.now()}_${index}`,
          _type: 'website',
          id: index + 1,
          name: columns[0] || `Website ${index + 1}`,
          description: columns[1] || '',
          cms: columns[2] || 'Unknown',
          dept: columns[3] || 'Unknown',
          category: columns[4] || 'General',
          order: index + 1
        })
      }
    })
    
    return websites
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const text = await file.text()
      const websites = parseCsv(text)
      
      if (websites.length === 0) {
        setError('No valid data found in CSV. Please check the format.')
        return
      }

      // Merge with existing websites
      const existingWebsites = value || []
      const newWebsites = [...existingWebsites, ...websites]
      onChange(newWebsites)
      
    } catch (err) {
      setError('Error reading CSV file. Please try again.')
      console.error('CSV parsing error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const clearWebsites = () => {
    onChange([])
    setError(null)
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            Upload a CSV file with website data
          </div>
          <div className="text-xs text-gray-500">
            Expected format: Name, Description, CMS/Technology, Department, Category
          </div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {isUploading && (
            <div className="text-sm text-blue-600">Processing CSV...</div>
          )}
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
        </div>
      </div>

      {value && value.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              {value.length} website{value.length !== 1 ? 's' : ''} loaded
            </div>
            <button
              type="button"
              onClick={clearWebsites}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear all
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
            {value.slice(0, 5).map((website: any, index: number) => (
              <div key={website._key || index} className="text-xs py-1">
                <strong>{website.name}</strong> - {website.description}
              </div>
            ))}
            {value.length > 5 && (
              <div className="text-xs text-gray-500 py-1">
                ... and {value.length - 5} more
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        <strong>CSV Format:</strong> Each row should have: Name, Description, Technology/CMS, Department, Category
        <br />
        <strong>Example:</strong> "Hillsdale EDU", "www.hillsdale.edu", "WordPress", "Marketing", "Website"
      </div>
    </div>
  )
}
