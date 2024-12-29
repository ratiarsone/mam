'use client'

import { useDraggable } from '@dnd-kit/core'
import { CanvasImage, GenerationType, PromptHistory } from '@/types/canvas'
import { Button } from './ui/button'
import { Wand2 } from 'lucide-react'
import { useState, useCallback } from 'react'

interface Transform {
  scale: number
  positionX: number
  positionY: number
}

interface DraggableImageProps {
  image: CanvasImage
  onPositionChange: (id: string, x: number, y: number) => void
  onDragEnd: (id: string, x: number, y: number) => void
  onIteratePrompt: (prompt: string, type: GenerationType, promptHistory: PromptHistory[]) => void
  isSelected?: boolean
  transform: Transform
}

export default function DraggableImage({
  image,
  onPositionChange,
  onDragEnd,
  onIteratePrompt,
  isSelected = false,
  transform
}: DraggableImageProps) {
  const [isDragging, setIsDragging] = useState(false)

  const {attributes, listeners, setNodeRef, transform: dragTransform} = useDraggable({
    id: image.id,
    data: {
      type: 'image',
      current: image
    }
  })

  const style = {
    position: 'absolute',
    left: `${image.x}px`,
    top: `${image.y}px`,
    transform: dragTransform ? 
      `translate3d(${dragTransform.x / transform.scale}px, ${dragTransform.y / transform.scale}px, 0)` : 
      'translate3d(0px, 0px, 0)',
    transition: dragTransform ? undefined : 'transform 0.1s ease-out',
    zIndex: isDragging ? 1000 : 1
  } as const

  const handleIterateClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onIteratePrompt(image.prompt, image.type, image.promptHistory || [])
  }, [image, onIteratePrompt])

  // Check if the image source is a base64 string
  const imageSrc = image.src.startsWith('data:') ? image.src : `data:image/png;base64,${image.src}`

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group cursor-move ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
    >
      <div className="relative">
        <img
          src={imageSrc}
          alt={image.prompt}
          width={256}
          height={256}
          className="rounded-lg shadow-lg"
          draggable={false}
        />
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
          onClick={handleIterateClick}
          type="button"
        >
          <Wand2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

