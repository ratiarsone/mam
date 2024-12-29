'use server'

import { experimental_generateImage as generateImage, type GenerateImageResponse } from 'ai'
import { openai } from '@ai-sdk/openai'
import { GenerationType, PromptHistory } from '@/types/canvas'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Export all server actions
export async function createBoard(name: string) {
  try {
    // First verify connection and permissions
    const { data: testData, error: testError } = await supabase
      .from('boards')
      .select('*')
      .limit(1)

    if (testError) {
      console.error('Database connection test failed:', testError)
      throw new Error(`Database connection error: ${testError.message}`)
    }

    // Attempt to create the board
    const { data, error } = await supabase
      .from('boards')
      .insert([{
        name,
        created_at: new Date().toISOString()
      }])
      .select()

    if (error) {
      console.error('Insert error:', error)
      throw new Error(`Failed to create board: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned from insert')
    }

    const board = data[0]

    revalidatePath('/')
    return {
      success: true,
      boardId: board.id,
      data: board
    }
  } catch (error) {
    console.error('Create board error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create board'
    }
  }
}

export async function deleteBoard(id: string) {
  try {
    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', id)

    if (error) throw error
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Delete board error:', error)
    return { success: false, error: 'Failed to delete board' }
  }
}

export async function renameBoard(id: string, name: string) {
  try {
    const { error } = await supabase
      .from('boards')
      .update({ name })
      .eq('id', id)

    if (error) throw error
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Rename board error:', error)
    return { success: false, error: 'Failed to rename board' }
  }
}

export async function generateImageFromPrompt(
  prompt: string, 
  type: GenerationType,
  previousPrompts: PromptHistory[] = []
) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured')
      return {
        success: false,
        error: 'OpenAI API key is not configured'
      }
    }

    const promptHistory = previousPrompts
      .map(p => `v${p.version}: ${p.prompt}`)
      .join('\n')
    
    const fullPrompt = previousPrompts.length > 0
      ? `Previous versions:\n${promptHistory}\n\nNew version: ${prompt}`
      : prompt

    console.log('Generating image with prompt:', fullPrompt)

    const { image } = await generateImage({
      model: openai.image('dall-e-3'),
      prompt: fullPrompt,
      size: '1024x1024',
    })

    if (!image?.base64) {
      console.error('No image data received from OpenAI')
      return {
        success: false,
        error: 'Failed to generate image: No image data received'
      }
    }

    return {
      success: true,
      image: image.base64,
      prompt,
      type
    }
  } catch (error) {
    console.error('Image generation error:', error)
    return {
      success: false,
      error: error instanceof Error 
        ? `Failed to generate image: ${error.message}`
        : 'Failed to generate image: Unknown error occurred'
    }
  }
}

export async function saveImage(
  boardId: string,
  src: string,
  x: number,
  y: number,
  prompt: string,
  type: string,
  version: number,
  basePrompt: string | null,
  promptHistory: PromptHistory[]
) {
  try {
    const { error } = await supabase
      .from('images')
      .insert([{
        board_id: boardId,
        src,
        x,
        y,
        prompt,
        type,
        version,
        base_prompt: basePrompt,
        prompt_history: promptHistory
      }])

    if (error) throw error
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Save image error:', error)
    return { success: false, error: 'Failed to save image' }
  }
}

export async function updateImagePosition(id: string, x: number, y: number) {
  try {
    if (!id || typeof x !== 'number' || typeof y !== 'number') {
      console.error('Invalid parameters:', { id, x, y })
      return { 
        success: false, 
        error: 'Invalid parameters for image position update' 
      }
    }

    const intX = Math.round(x)
    const intY = Math.round(y)

    // First check if the image exists
    const { data: existingImage, error: checkError } = await supabase
      .from('images')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !existingImage) {
      console.error('Image not found:', id)
      return { 
        success: false, 
        error: 'Image not found' 
      }
    }

    const { error } = await supabase
      .from('images')
      .update({ 
        x: intX, 
        y: intY,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Supabase update error:', error)
      return { 
        success: false, 
        error: error.message 
      }
    }
    
    revalidatePath('/')
    return { 
      success: true,
      data: {
        id,
        x: intX,
        y: intY
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Update image position error:', { error, message })
    return { 
      success: false, 
      error: message
    }
  }
}

export async function saveText(
  boardId: string,
  content: string,
  x: number,
  y: number,
  fontSize: string | null = null
) {
  try {
    const { error } = await supabase
      .from('texts')
      .insert([{
        board_id: boardId,
        content,
        x,
        y,
        font_size: fontSize
      }])

    if (error) throw error
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Save text error:', error)
    return { success: false, error: 'Failed to save text' }
  }
}

export async function updateText(
  id: string, 
  content: string, 
  fontSize: string | null = null
) {
  try {
    const { data, error } = await supabase
      .from('texts')
      .update({ 
        content, 
        font_size: fontSize 
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase update text error:', error)
      return { 
        success: false, 
        error: error.message 
      }
    }

    revalidatePath('/')
    return { 
      success: true,
      data
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update text'
    console.error('Update text error:', { error, message })
    return { 
      success: false, 
      error: message
    }
  }
}

export async function updateTextPosition(id: string, x: number, y: number) {
  try {
    const intX = Math.round(x)
    const intY = Math.round(y)

    const { data, error } = await supabase
      .from('texts')
      .update({ x: intX, y: intY })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase update text position error:', error)
      return { 
        success: false, 
        error: error.message 
      }
    }

    revalidatePath('/')
    return { 
      success: true,
      data
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update text position'
    console.error('Update text position error:', { error, message })
    return { 
      success: false, 
      error: message
    }
  }
}

export async function deleteText(id: string) {
  try {
    const { error } = await supabase
      .from('texts')
      .delete()
      .eq('id', id)

    if (error) throw error
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Delete text error:', error)
    return { success: false, error: 'Failed to delete text' }
  }
}

export async function createGroup(boardId: string, memberIds: string[]) {
  try {
    const { data, error: groupError } = await supabase
      .from('groups')
      .insert([{ 
        board_id: boardId
      }])
      .select()
      .single()

    if (groupError) throw groupError

    const groupId = data.id

    const { error: imageError } = await supabase
      .from('images')
      .update({ group_id: groupId })
      .in('id', memberIds)

    if (imageError) throw imageError

    const { error: textError } = await supabase
      .from('texts')
      .update({ group_id: groupId })
      .in('id', memberIds)

    if (textError) throw textError

    revalidatePath('/')
    return groupId
  } catch (error) {
    console.error('Create group error:', error)
    throw error
  }
}

export async function getBoards() {
  try {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get boards error:', error)
    throw error
  }
}

export async function getBoardContent(boardId: string) {
  try {
    const { data: images, error: imagesError } = await supabase
      .from('images')
      .select('*')
      .eq('board_id', boardId)

    if (imagesError) throw imagesError

    const { data: texts, error: textsError } = await supabase
      .from('texts')
      .select('*')
      .eq('board_id', boardId)

    if (textsError) throw textsError

    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .eq('board_id', boardId)

    if (groupsError) throw groupsError

    return { 
      images: images || [], 
      texts: texts || [], 
      groups: groups || [] 
    }
  } catch (error) {
    console.error('Get board content error:', error)
    throw error
  }
}

