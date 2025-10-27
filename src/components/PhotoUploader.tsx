
import React from 'react'

type Props = { label?: string, onChange: (file: File) => void }

export default function PhotoUploader({label='Upload photo', onChange}: Props){
  const [preview, setPreview] = React.useState<string | null>(null)
  const handle = (e: React.ChangeEvent<HTMLInputElement>)=>{
    const f = e.target.files?.[0]
    if(!f) return
    setPreview(URL.createObjectURL(f))
    onChange(f)
  }
  return (
    <div>
      <label style={{display:'block', marginBottom:8}}>{label}</label>
      <input type="file" accept="image/*" onChange={handle} className="input" />
      {preview && <div style={{marginTop:12}}><img src={preview} alt="preview" style={{maxWidth:'100%', borderRadius:12, border:'1px solid #1b3b5e'}}/></div>}
    </div>
  )
}
