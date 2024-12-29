'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { 
  DndContext, 
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { CanvasImage, CanvasText, GenerationType, PromptHistory } from '../types/canvas'
import DraggableImage from './draggable-image'
import DraggableText from './draggable-text'
import { SelectionOverlay } from './selection-overlay'
import { GroupButton } from './group-button'
import { SelectionCount } from './selection-count'

interface Transform {
  scale: number
  positionX: number
  positionY: number
}

const defaultTransform: Transform = {
  scale: 1,
  positionX: 0,
  positionY: 0
}

interface InfiniteCanvasProps {
  images: CanvasImage[]
  texts: CanvasText[]
  onCanvasClick: (x: number, y: number) => void
  isPendingPlacement: boolean
  isAddingText: boolean
  onUpdateImagePosition: (id: string, x: number, y: number) => void
  onUpdateTextPosition: (id: string, x: number, y: number) => void
  onUpdateText: (id: string, content: string) => void
  onDeleteText: (id: string) => void
  onIteratePrompt: (prompt: string, type: GenerationType, promptHistory: PromptHistory[]) => void
  onCreateGroup: (memberIds: string[]) => void
}

export default function InfiniteCanvas({ 
  images = [], 
  texts = [], 
  onCanvasClick,
  isPendingPlacement = false,
  isAddingText = false,
  onUpdateImagePosition,
  onUpdateTextPosition,
  onUpdateText,
  onDeleteText,
  onIteratePrompt,
  onCreateGroup
}: InfiniteCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const transformComponentRef = useRef<any>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 })
  const [selectionCurrent, setSelectionCurrent] = useState({ x: 0, y: 0 })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [transform, setTransform] = useState<Transform>(defaultTransform)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const currentItemRef = useRef<{ id: string; x: number; y: number } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  useEffect(() => {
    const updateTransform = () => {
      if (transformComponentRef.current) {
        const { state } = transformComponentRef.current
        if (state) {
          setTransform({
            scale: state.scale ?? defaultTransform.scale,
            positionX: state.positionX ?? defaultTransform.positionX,
            positionY: state.positionY ?? defaultTransform.positionY
          })
        }
      }
    }

    updateTransform()
    const intervalId = setInterval(updateTransform, 100)
    return () => clearInterval(intervalId)
  }, [])

  const handleTransform = useCallback(() => {
    if (transformComponentRef.current) {
      const { state } = transformComponentRef.current
      if (state) {
        setTransform({
          scale: state.scale ?? defaultTransform.scale,
          positionX: state.positionX ?? defaultTransform.positionX,
          positionY: state.positionY ?? defaultTransform.positionY
        })
      }
    }
  }, [])

  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    if (!containerRef.current) return { x: screenX, y: screenY }
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = (screenX - rect.left - transform.positionX) / transform.scale
    const y = (screenY - rect.top - transform.positionY) / transform.scale
    
    return { x, y }
  }, [transform])

  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    setIsDragging(true)
    const { current } = active.data.current as { current: CanvasImage | CanvasText }
    dragStartRef.current = { x: current.x, y: current.y }
    currentItemRef.current = { id: current.id, x: current.x, y: current.y }
  }, [])

  const handleDragMove = useCallback(({ delta }: DragMoveEvent) => {
    if (!isDragging || !dragStartRef.current || !currentItemRef.current) return

    const newX = dragStartRef.current.x + delta.x / transform.scale
    const newY = dragStartRef.current.y + delta.y / transform.scale

    if (currentItemRef.current) {
      currentItemRef.current.x = newX
      currentItemRef.current.y = newY
    }
  }, [isDragging, transform.scale])

  const handleDragEnd = useCallback(({ delta, active }: DragEndEvent) => {
    setIsDragging(false)
    
    if (!dragStartRef.current || !currentItemRef.current) return
    
    const finalX = dragStartRef.current.x + delta.x / transform.scale
    const finalY = dragStartRef.current.y + delta.y / transform.scale
    
    const { type } = active.data.current as { type: 'image' | 'text' }
    
    if (type === 'image') {
      onUpdateImagePosition(currentItemRef.current.id, finalX, finalY)
    } else if (type === 'text') {
      onUpdateTextPosition(currentItemRef.current.id, finalX, finalY)
    }
    
    dragStartRef.current = null
    currentItemRef.current = null
  }, [transform.scale, onUpdateImagePosition, onUpdateTextPosition])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || isPendingPlacement || isAddingText) return
    
    const { x, y } = screenToCanvas(e.clientX, e.clientY)
    
    setIsSelecting(true)
    setSelectionStart({ x, y })
    setSelectionCurrent({ x, y })
  }, [isPendingPlacement, isAddingText, screenToCanvas])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelecting || !containerRef.current) return

    const { x, y } = screenToCanvas(e.clientX, e.clientY)
    setSelectionCurrent({ x, y })

    const left = Math.min(selectionStart.x, x)
    const right = Math.max(selectionStart.x, x)
    const top = Math.min(selectionStart.y, y)
    const bottom = Math.max(selectionStart.y, y)

    const selectedImages = images.filter(image => {
      const imageRight = image.x + 256
      const imageBottom = image.y + 256
      return (
        image.x < right &&
        imageRight > left &&
        image.y < bottom &&
        imageBottom > top
      )
    })

    const selectedTexts = texts.filter(text => {
      return (
        text.x < right &&
        text.x > left &&
        text.y < bottom &&
        text.y > top
      )
    })

    setSelectedIds([
      ...selectedImages.map(img => img.id),
      ...selectedTexts.map(text => text.id)
    ])
  }, [isSelecting, selectionStart, images, texts, screenToCanvas])

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false)
  }, [])

  const handleCreateGroup = useCallback(() => {
    if (selectedIds.length > 1) {
      onCreateGroup(selectedIds)
      setSelectedIds([])
    }
  }, [selectedIds, onCreateGroup])

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return

    const { x, y } = screenToCanvas(e.clientX, e.clientY)
    onCanvasClick(x, y)
  }, [onCanvasClick, screenToCanvas])

  return (
    <div className="w-full h-screen bg-grid-pattern">
      <DndContext 
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <TransformWrapper
          ref={transformComponentRef}
          onTransformed={handleTransform}
          initialScale={1}
          minScale={0.1}
          maxScale={5}
          limitToBounds={false}
          disabled={isPendingPlacement || isAddingText || isSelecting}
          wheel={{ disabled: isPendingPlacement || isAddingText || isSelecting }}
        >
          <TransformComponent
            wrapperClass="w-full h-full"
            contentClass="w-full h-full"
          >
            <div 
              ref={containerRef}
              className="relative w-[10000px] h-[10000px]"
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {images.map((image) => (
                <DraggableImage
                  key={image.id}
                  image={image}
                  onPositionChange={onUpdateImagePosition}
                  onDragEnd={onUpdateImagePosition}
                  onIteratePrompt={onIteratePrompt}
                  isSelected={selectedIds.includes(image.id)}
                  transform={transform}
                />
              ))}
              {texts.map((text) => (
                <DraggableText
                  key={text.id}
                  text={text}
                  onPositionChange={onUpdateTextPosition}
                  onDragEnd={onUpdateTextPosition}
                  onTextChange={onUpdateText}
                  onTextDelete={onDeleteText}
                  isSelected={selectedIds.includes(text.id)}
                  transform={transform}
                />
              ))}
              {isSelecting && (
                <SelectionOverlay
                  startX={selectionStart.x}
                  startY={selectionStart.y}
                  currentX={selectionCurrent.x}
                  currentY={selectionCurrent.y}
                />
              )}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </DndContext>
      <SelectionCount count={selectedIds.length} />
      {selectedIds.length > 1 && (
        <GroupButton onGroup={handleCreateGroup} />
      )}
    </div>
  )
}

