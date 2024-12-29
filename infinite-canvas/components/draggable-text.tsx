'use client'

import { useState, useRef, useEffect } from 'react'
import { CanvasText } from '@/types/canvas'
import { useDraggable } from '@dnd-kit/core'
import { Button } from './ui/button'
import { Type, Trash2 } from 'lucide-react'
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

interface Transform {
  scale: number
  positionX: number
  positionY: number
}

interface TextStyle {
  fontSize: 'small' | 'medium' | 'large'
}

interface DraggableTextProps {
  text: CanvasText
  onPositionChange: (id: string, x: number, y: number) => void
  onDragEnd: (id: string, x: number, y: number) => void
  onTextChange: (id: string, content: string, shouldSave?: boolean) => void
  onTextDelete: (id: string) => void
  isSelected?: boolean
  transform: Transform
}

export default function DraggableText({
  text,
  onPositionChange,
  onDragEnd,
  onTextChange,
  onTextDelete,
  isSelected = false,
  transform
}: DraggableTextProps) {
  const [isEditing, setIsEditing] = useState(text.isEditing)
  const [localContent, setLocalContent] = useState(text.content)
  const [textStyle, setTextStyle] = useState<TextStyle>({
    fontSize: text.fontSize || 'medium'
  })
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Update local content when text prop changes
  useEffect(() => {
    setLocalContent(text.content)
  }, [text.content])

  // Auto-resize textarea as content changes
  useEffect(() => {
    if (inputRef.current && isEditing) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  }, [localContent, isEditing])

  const {attributes, listeners, setNodeRef, transform: dragTransform} = useDraggable({
    id: text.id,
    data: {
      type: 'text',
      current: text
    }
  })

  const style = {
    position: 'absolute',
    left: `${text.x}px`,
    top: `${text.y}px`,
    zIndex: isEditing ? 100 : 1,
    transform: dragTransform ? 
      `translate3d(${dragTransform.x / transform.scale}px, ${dragTransform.y / transform.scale}px, 0)` : 
      'translate3d(0px, 0px, 0)',
    transition: dragTransform ? undefined : 'transform 0.1s ease-out'
  } as const

  const textStyles = {
    fontSize: textStyle.fontSize === 'large' ? '2rem' : 
             textStyle.fontSize === 'small' ? '0.75rem' : 
             '1.25rem',
    lineHeight: '1.2',
    width: 'auto',
    minWidth: '100px'
  }

  const handleDoubleClick = () => {
    setIsEditing(true)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }, 0)
  }

  const handleBlur = () => {
    setIsEditing(false)
    // Save to database only on blur
    onTextChange(text.id, localContent, true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      setIsEditing(false)
      // Save to database on enter
      onTextChange(text.id, localContent, true)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setLocalContent(newContent)
    // Update local state only, don't save to database yet
    onTextChange(text.id, newContent, false)
    
    // Adjust height as content changes
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  const handleDelete = () => {
    onTextDelete(text.id)
  }

  const handleStyleChange = (value: 'small' | 'medium' | 'large') => {
    setTextStyle({ fontSize: value })
  }

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      >
        <textarea
          ref={inputRef}
          value={localContent}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={textStyles}
          className="bg-transparent resize-none outline-none p-2 overflow-hidden break-words whitespace-pre-wrap"
          autoFocus
          rows={1}
        />
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={handleDoubleClick}
      className={`group cursor-move ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div 
        className="p-2 whitespace-pre-wrap break-words"
        style={textStyles}
      >
        {localContent || <span className="text-gray-400">Double click to edit</span>}
      </div>
      <div className="absolute -top-12 left-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <ToggleGroup 
          type="single" 
          value={textStyle.fontSize}
          onValueChange={(value: 'small' | 'medium' | 'large') => {
            if (value) handleStyleChange(value)
          }}
          className="bg-background border rounded-lg p-1"
        >
          <ToggleGroupItem value="small" aria-label="Small text">
            <Type className="h-3 w-3" />
          </ToggleGroupItem>
          <ToggleGroupItem value="medium" aria-label="Medium text">
            <Type className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="large" aria-label="Large text">
            <Type className="h-5 w-5" />
          </ToggleGroupItem>
        </ToggleGroup>

        <Button
          variant="destructive"
          size="icon"
          onClick={handleDelete}
          className="h-8 w-8"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

