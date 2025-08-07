import React, { useState } from 'react'
import { set, unset } from 'sanity'
import { Button, Card, Stack, TextInput, Label } from '@sanity/ui'

interface SliderPairInputProps {
  type: any
  value: any
  onChange: (patch: any) => void
  onFocus: () => void
  onBlur: () => void
  markers: any[]
  presence: any[]
  readOnly?: boolean
}

export default function SliderPairInput({ type, value, onChange }: SliderPairInputProps) {
  const [formData, setFormData] = useState({
    title: value?.title || '',
    leftSide: value?.leftSide || '',
    rightSide: value?.rightSide || '',
  })

  const handleSave = () => {
    // Validate required fields
    if (!formData.title || !formData.leftSide || !formData.rightSide) {
      alert('Please fill in all required fields')
      return
    }

    // Create the pair data with a unique key
    const pairData = {
      _key: value?._key || `pair-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: formData.title,
      leftSide: formData.leftSide,
      rightSide: formData.rightSide,
    }

    // Update the value
    onChange(set(pairData))
  }

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      title: value?.title || '',
      leftSide: value?.leftSide || '',
      rightSide: value?.rightSide || '',
    })
  }

  return (
    <Card padding={4}>
      <Stack space={4}>
        <Stack space={2}>
          <Label>Pair Title *</Label>
          <TextInput
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter pair title"
          />
        </Stack>

        <Stack space={2}>
          <Label>Left Side *</Label>
          <TextInput
            value={formData.leftSide}
            onChange={(e) => setFormData({ ...formData, leftSide: e.target.value })}
            placeholder="Enter left side text"
          />
        </Stack>

        <Stack space={2}>
          <Label>Right Side *</Label>
          <TextInput
            value={formData.rightSide}
            onChange={(e) => setFormData({ ...formData, rightSide: e.target.value })}
            placeholder="Enter right side text"
          />
        </Stack>

        <Stack space={3} style={{ marginTop: '20px' }}>
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            justifyContent: 'flex-end'
          }}>
            <Button
              mode="ghost"
              onClick={handleCancel}
              text="Cancel"
            />
            <Button
              mode="default"
              onClick={handleSave}
              text="Save Pair"
            />
          </div>
        </Stack>
      </Stack>
    </Card>
  )
}
