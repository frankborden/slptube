import { load } from './state'
import { downloadReplay } from './supabaseClient'

export async function loadFromSupabase (id: string): Promise<void> {
  const { data, error } = await downloadReplay(id)
  if (data != null) {
    const file = new File([data], 'download.slp')
    return await load([file], 0)
  }
  if (error != null) {
    console.error('Error: could not load replay', error)
  }
}