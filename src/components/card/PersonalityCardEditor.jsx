import PersonalityCard from './PersonalityCard'

export default function PersonalityCardEditor({
  cardName,
  prompt,
  confirmed,
  showValidation = false,
  disabled = false,
  onChange,
  onConfirm,
  onEdit,
}) {
  return (
    <PersonalityCard
      variant="editor"
      editorCardName={cardName}
      editorPrompt={prompt}
      editorConfirmed={confirmed}
      showValidation={showValidation}
      disabled={disabled}
      onEditorChange={onChange}
      onEditorConfirm={onConfirm}
      onEditorEdit={onEdit}
    />
  )
}
