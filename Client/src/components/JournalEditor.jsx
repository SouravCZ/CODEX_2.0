import { useEffect, useState } from 'react'
import { createEntry, listEntries } from '../services/journalService'

function JournalEditor() {
  const [content, setContent] = useState('')
  const [entries, setEntries] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    listEntries(30)
      .then((data) => {
        if (active) setEntries(Array.isArray(data) ? data : data?.entries || [])
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  async function handleSave() {
    if (!content.trim()) return
    setSaving(true)
    setError('')
    try {
      const entry = await createEntry(content)
      setEntries((prev) => [entry, ...prev])
      setContent('')
    } catch (err) {
      setError(err.message || 'Could not save entry.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-lg">
      <div className="glass-card rounded-[24px] p-6 md:p-8 flex flex-col gap-4">
        <label className="sr-only" htmlFor="journal-content">
          Journal entry
        </label>
        <textarea
          className="w-full bg-[#12281D]/30 border border-[#EFE4AE]/20 rounded-xl px-4 py-3 font-body-md text-[#EFE4AE] placeholder:text-[#EFE4AE]/50 focus:border-[#EFE4AE] focus:ring-1 focus:ring-[#EFE4AE] transition-all resize-none min-h-[160px]"
          id="journal-content"
          placeholder="What is on your mind today?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        ></textarea>
        {error && (
          <p className="font-label-sm text-error" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <button
            className="bg-[#EFE4AE] text-[#12281D] font-label-md rounded-full px-6 py-3 hover:bg-[#EFE4AE]/90 transition-all duration-300 active:scale-95 disabled:opacity-60 flex items-center gap-2"
            type="button"
            onClick={handleSave}
            disabled={saving || !content.trim()}
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {saving ? 'Saving…' : 'Save Entry'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {entries.length === 0 && (
          <p className="font-body-md text-[#EFE4AE]/60 text-center py-10">
            No entries yet. Your reflections will appear here.
          </p>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="glass-card rounded-2xl p-5">
            <p className="font-label-sm text-[#EFE4AE]/50 mb-2">
              {entry.created_at || entry.timestamp
                ? new Date(entry.created_at || entry.timestamp).toLocaleString()
                : 'Just now'}
            </p>
            <p className="font-body-md text-[#EFE4AE]/90 whitespace-pre-wrap">
              {entry.content || entry.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default JournalEditor
